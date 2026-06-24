#!/usr/bin/env bash
# ============================================================
# run-full-seeds.sh — Nạp dữ liệu ảo đầy đủ vào ECC HR System
#
# Yêu cầu:
#   - Docker đang chạy với stack ECC (compose.infra + iam + hr + business + edge)
#   - Chạy từ thư mục gốc dự án: bash docker/seed/run-full-seeds.sh
#
# Tài khoản mặc định sau khi chạy:
#   admin          → ADMIN           (mật khẩu: Admin@123456)
#   hr.manager     → HR_MANAGER
#   payroll.officer→ PAYROLL_OFFICER
#   manager        → MANAGER
#   employee       → EMPLOYEE
#   tran.duc.hung  → DEPARTMENT_HEAD
#   nguyen.minh.tuan → HR_MANAGER
#   pham.bich.ngoc → MANAGER         ... (và 12 tài khoản khác)
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Đọc biến môi trường từ .env ─────────────────────────────
ENV_FILE="$(dirname "$(dirname "$SCRIPT_DIR")")/.env"
if [[ -f "$ENV_FILE" ]]; then
    # shellcheck disable=SC1090
    set -a; source "$ENV_FILE"; set +a
    echo "[INFO] Đã load .env từ: $ENV_FILE"
else
    echo "[WARN] Không tìm thấy .env — dùng giá trị mặc định"
fi

# ── Container names ─────────────────────────────────────────
AUTH_POSTGRES="${AUTH_POSTGRES_CONTAINER:-auth-postgres}"
HR_MYSQL="${HR_MYSQL_CONTAINER:-hr-mysql}"
BUSINESS_MYSQL="${BUSINESS_MYSQL_CONTAINER:-business-mysql}"

# ── DB credentials ──────────────────────────────────────────
POSTGRES_DB="${POSTGRES_DB:-auth_service}"
POSTGRES_USER="${POSTGRES_USER:-auth_user}"
MYSQL_ROOT_PASSWORD="${MYSQL_ROOT_PASSWORD:-change_me}"
BUSINESS_DB_USERNAME="${BUSINESS_DB_USERNAME:-business_user}"
BUSINESS_DB_PASSWORD="${BUSINESS_DB_PASSWORD:-business_password}"

# ── Màu sắc terminal ────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'

log_info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
log_ok()      { echo -e "${GREEN}[OK]${NC}    $*"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $*"; }
log_section() { echo -e "\n${CYAN}══════════════════════════════════════${NC}"; echo -e "${CYAN} $*${NC}"; echo -e "${CYAN}══════════════════════════════════════${NC}"; }

# ── Kiểm tra container đang chạy ────────────────────────────
wait_container() {
    local container="$1"
    local max_wait=60
    local elapsed=0
    log_info "Chờ container '$container' sẵn sàng..."
    until docker ps --filter "name=^/${container}$" --filter "status=running" --format "{{.Names}}" | grep -q "^${container}$"; do
        if [[ $elapsed -ge $max_wait ]]; then
            log_error "Container '$container' chưa chạy sau ${max_wait}s. Hủy."
            log_warn  "Hãy chạy: docker compose -f compose.infra.yml -f compose.iam.yml -f compose.hr.yml -f compose.business.yml -f compose.edge.yml up -d"
            exit 1
        fi
        sleep 3; ((elapsed+=3))
    done
    log_ok "Container '$container' đang chạy."
}

# ── Chạy SQL trên PostgreSQL ─────────────────────────────────
run_psql() {
    local container="$1"
    local db="$2"
    local user="$3"
    local sql_file="$4"
    log_info "Nạp $(basename "$sql_file") vào PostgreSQL (${container}/${db})..."
    docker exec -i "$container" \
        psql -U "$user" -d "$db" \
        --set ON_ERROR_STOP=1 \
        < "$sql_file"
    log_ok "Hoàn thành: $(basename "$sql_file")"
}

# ── Chạy SQL trên MySQL ──────────────────────────────────────
run_mysql() {
    local container="$1"
    local user="$2"
    local password="$3"
    local sql_file="$4"
    log_info "Nạp $(basename "$sql_file") vào MySQL (${container}, user=${user})..."
    docker exec -i "$container" \
        mysql -u"${user}" -p"${password}" \
        --default-character-set=utf8mb4 \
        < "$sql_file"
    log_ok "Hoàn thành: $(basename "$sql_file")"
}

# ════════════════════════════════════════════════════════════
#  MAIN
# ════════════════════════════════════════════════════════════
log_section "ECC HR System — Full Seed Runner"
echo "  Auth PostgreSQL : ${AUTH_POSTGRES} / ${POSTGRES_DB}"
echo "  HR MySQL        : ${HR_MYSQL}"
echo "  Business MySQL  : ${BUSINESS_MYSQL}"
echo ""

# 1. Kiểm tra containers
log_section "1. Kiểm tra containers"
wait_container "$AUTH_POSTGRES"
wait_container "$HR_MYSQL"
wait_container "$BUSINESS_MYSQL"

# 2. Auth seed (PostgreSQL)
log_section "2. Auth Service — Roles & Users (PostgreSQL)"
run_psql "$AUTH_POSTGRES" "$POSTGRES_DB" "$POSTGRES_USER" \
    "$SCRIPT_DIR/full-auth-seed.sql"

# 3. HR seed (MySQL)
log_section "3. HR Service — Org, Employees, Payroll (MySQL)"
run_mysql "$HR_MYSQL" "root" "$MYSQL_ROOT_PASSWORD" \
    "$SCRIPT_DIR/full-hr-seed.sql"

# 4. Business seed (MySQL — project_db + task_db, dùng business_user)
log_section "4. Business Services — Projects & Tasks (MySQL)"
run_mysql "$BUSINESS_MYSQL" "$BUSINESS_DB_USERNAME" "$BUSINESS_DB_PASSWORD" \
    "$SCRIPT_DIR/full-business-seed.sql"

# ── Thống kê kết quả ─────────────────────────────────────────
log_section "Kết quả nạp dữ liệu"

echo ""
echo "  📊 Auth Service (PostgreSQL):"
docker exec "$AUTH_POSTGRES" \
    psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c \
    "SELECT '  Users: ' || COUNT(*) FROM users; SELECT '  Roles: ' || COUNT(*) FROM role_definitions;" \
    2>/dev/null | grep -v '^$' || true

echo ""
echo "  📊 HR Service (MySQL):"
docker exec "$HR_MYSQL" mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" hr_service -N -e \
    "SELECT CONCAT('  Nhân viên     : ', COUNT(*)) FROM employee;
     SELECT CONCAT('  Phòng ban     : ', COUNT(*)) FROM departments;
     SELECT CONCAT('  Đơn vị tổ chức: ', COUNT(*)) FROM organization_units;
     SELECT CONCAT('  Kết quả lương : ', COUNT(*)) FROM payroll_result;
     SELECT CONCAT('  Loại khấu trừ : ', COUNT(*)) FROM deduction_type;" \
    2>/dev/null || true

echo ""
echo "  📊 Business (MySQL):"
docker exec "$BUSINESS_MYSQL" mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" -N -e \
    "SELECT CONCAT('  Dự án    (project_db): ', COUNT(*)) FROM project_db.projects;
     SELECT CONCAT('  Phân công(project_db): ', COUNT(*)) FROM project_db.project_assignments;
     SELECT CONCAT('  Task     (task_db)   : ', COUNT(*)) FROM task_db.tasks;
     SELECT CONCAT('  Task log (task_db)   : ', COUNT(*)) FROM task_db.task_history;" \
    2>/dev/null || true

echo ""
log_ok "══════════════════════════════════════════"
log_ok " Seed dữ liệu hoàn tất!"
log_ok "══════════════════════════════════════════"
echo ""
echo "  Truy cập hệ thống:"
echo "    Frontend : http://localhost:3000"
echo "    API GW   : http://localhost:8080"
echo "    Swagger  : http://localhost:8080/swagger-ui.html"
echo "    Grafana  : http://localhost:3001  (admin/admin)"
echo ""
echo "  Tài khoản đăng nhập (mật khẩu: Admin@123456):"
printf "    %-22s %-16s %s\n" "Username" "Role" "Tên"
printf "    %-22s %-16s %s\n" "--------" "----" "---"
printf "    %-22s %-16s %s\n" "admin"             "ADMIN"           "Nguyễn Hữu Hùng (CTO)"
printf "    %-22s %-16s %s\n" "hr.manager"        "HR_MANAGER"      "Nguyễn Hà Linh"
printf "    %-22s %-16s %s\n" "nguyen.minh.tuan"  "HR_MANAGER"      "Nguyễn Minh Tuấn (HRD)"
printf "    %-22s %-16s %s\n" "payroll.officer"   "PAYROLL_OFFICER" "Đỗ Bảo Trâm"
printf "    %-22s %-16s %s\n" "pham.thu.hoa"      "PAYROLL_OFFICER" "Phạm Thu Hoà"
printf "    %-22s %-16s %s\n" "tran.duc.hung"     "DEPARTMENT_HEAD" "Trần Đức Hùng"
printf "    %-22s %-16s %s\n" "manager"           "MANAGER"         "Trần Minh Quân"
printf "    %-22s %-16s %s\n" "pham.bich.ngoc"    "MANAGER"         "Phạm Thị Bích Ngọc"
printf "    %-22s %-16s %s\n" "employee"          "EMPLOYEE"        "Lê Thu An"
printf "    %-22s %-16s %s\n" "nguyen.van.an"     "EMPLOYEE"        "Nguyễn Văn An"
echo ""
