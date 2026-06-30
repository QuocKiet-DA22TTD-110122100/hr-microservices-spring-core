from __future__ import annotations

import html
import re
import zipfile
from pathlib import Path


SRC = Path("KTtmp_chuong4_chuong5_fixed.docx")
OUT = Path("KTtmp_chuong4_chuong5_requirements_db.docx")


def esc(value: str) -> str:
    return html.escape(value, quote=True)


def paragraph(text: str = "", style: str = "noidung", *, italic: bool = False, align: str | None = None) -> str:
    ppr = []
    if style:
        ppr.append(f'<w:pStyle w:val="{esc(style)}"/>')
    if align:
        ppr.append(f'<w:jc w:val="{align}"/>')
    ppr_xml = f"<w:pPr>{''.join(ppr)}</w:pPr>" if ppr else ""
    rpr = "<w:rPr><w:i/></w:rPr>" if italic else ""
    run = f'<w:r>{rpr}<w:t xml:space="preserve">{esc(text)}</w:t></w:r>' if text else ""
    return f"<w:p>{ppr_xml}{run}</w:p>"


def table(rows: list[list[str]], widths: tuple[int, ...]) -> str:
    grid = "".join(f'<w:gridCol w:w="{width}"/>' for width in widths)
    table_rows = []
    for row_index, row in enumerate(rows):
        cells = []
        for cell_index, text in enumerate(row):
            shade = '<w:shd w:fill="D9EAF7"/>' if row_index == 0 else ""
            bold = "<w:rPr><w:b/></w:rPr>" if row_index == 0 else ""
            cells.append(
                "<w:tc><w:tcPr>"
                f'<w:tcW w:w="{widths[cell_index]}" w:type="dxa"/>{shade}'
                '<w:tcMar><w:top w:w="90" w:type="dxa"/>'
                '<w:left w:w="120" w:type="dxa"/>'
                '<w:bottom w:w="90" w:type="dxa"/>'
                '<w:right w:w="120" w:type="dxa"/></w:tcMar>'
                "</w:tcPr>"
                f'<w:p><w:r>{bold}<w:t xml:space="preserve">{esc(text)}</w:t></w:r></w:p>'
                "</w:tc>"
            )
        table_rows.append(f"<w:tr>{''.join(cells)}</w:tr>")
    return (
        '<w:tbl><w:tblPr><w:tblW w:w="9600" w:type="dxa"/>'
        '<w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="B7C9D6"/>'
        '<w:left w:val="single" w:sz="4" w:space="0" w:color="B7C9D6"/>'
        '<w:bottom w:val="single" w:sz="4" w:space="0" w:color="B7C9D6"/>'
        '<w:right w:val="single" w:sz="4" w:space="0" w:color="B7C9D6"/>'
        '<w:insideH w:val="single" w:sz="4" w:space="0" w:color="D7E1E8"/>'
        '<w:insideV w:val="single" w:sz="4" w:space="0" w:color="D7E1E8"/></w:tblBorders>'
        '<w:tblLook w:firstRow="1" w:lastRow="0" w:firstColumn="0" w:lastColumn="0" '
        'w:noHBand="0" w:noVBand="1"/></w:tblPr>'
        f"<w:tblGrid>{grid}</w:tblGrid>{''.join(table_rows)}</w:tbl>"
    )


def text_from_paragraph_xml(p_xml: str) -> str:
    texts = re.findall(r"<w:t[^>]*>(.*?)</w:t>", p_xml)
    text = "".join(re.sub(r"<[^>]+>", "", item) for item in texts)
    return html.unescape(text)


def insert_before_paragraph(document_xml: str, needle: str, insert_xml: str) -> str:
    pattern = re.compile(r"<w:p(?:\s[^>]*)?>[\s\S]*?</w:p>")
    for match in pattern.finditer(document_xml):
        if needle in text_from_paragraph_xml(match.group(0)):
            return document_xml[: match.start()] + insert_xml + document_xml[match.start() :]
    raise ValueError(f"Could not find paragraph containing: {needle}")


def insert_after_paragraph(document_xml: str, needle: str, insert_xml: str) -> str:
    pattern = re.compile(r"<w:p(?:\s[^>]*)?>[\s\S]*?</w:p>")
    for match in pattern.finditer(document_xml):
        if needle in text_from_paragraph_xml(match.group(0)):
            return document_xml[: match.end()] + insert_xml + document_xml[match.end() :]
    raise ValueError(f"Could not find paragraph containing: {needle}")


def chapter_2_requirements_base() -> str:
    return "".join([
        paragraph("2.3. Cơ sở xác định yêu cầu hệ thống", "h2"),
        paragraph("Yêu cầu hệ thống là căn cứ để chuyển bài toán nghiệp vụ thành các chức năng phần mềm có thể thiết kế, triển khai và kiểm thử. Trong đề tài này, yêu cầu được chia thành hai nhóm: yêu cầu chức năng và yêu cầu phi chức năng."),
        paragraph("Yêu cầu chức năng mô tả hệ thống phải làm gì, ví dụ đăng nhập, quản lý nhân viên, phân quyền, tạo dự án, giao việc và tính lương. Yêu cầu phi chức năng mô tả hệ thống phải đáp ứng như thế nào, ví dụ bảo mật, hiệu năng, khả năng mở rộng, tính sẵn sàng, khả năng bảo trì và khả năng quan sát."),
        paragraph("Việc tách rõ hai nhóm yêu cầu giúp quá trình thiết kế Microservices chính xác hơn. Các yêu cầu chức năng là cơ sở phân rã domain thành Auth Service, HR Service, Project Service, Task Service và API Gateway. Các yêu cầu phi chức năng là cơ sở lựa chọn JWT, RBAC, Docker, Redis, RabbitMQ, Eureka và bộ công cụ giám sát."),
    ])


def chapter_3_requirements() -> str:
    return "".join([
        paragraph("3.0. Phân tích yêu cầu hệ thống", "h2"),
        paragraph("Trước khi thiết kế kiến trúc và cơ sở dữ liệu, hệ thống cần được xác định rõ các yêu cầu nghiệp vụ và yêu cầu chất lượng. Các yêu cầu này phản ánh phạm vi bài toán quản lý nhân sự, bảng lương, dự án và công việc trong doanh nghiệp."),
        paragraph("3.0.1. Yêu cầu chức năng", "Heading30"),
        table([
            ["Mã yêu cầu", "Nhóm chức năng", "Mô tả yêu cầu"],
            ["FR-01", "Xác thực", "Người dùng có thể đăng nhập, đăng xuất, đổi mật khẩu và kiểm tra phiên làm việc bằng JWT."],
            ["FR-02", "Phân quyền", "Hệ thống quản lý vai trò, quyền hạn và chỉ cho phép người dùng truy cập chức năng phù hợp với quyền được cấp."],
            ["FR-03", "Quản lý người dùng", "Quản trị viên có thể tạo, cập nhật, khóa/mở tài khoản và đồng bộ thông tin tài khoản sang hồ sơ nhân viên."],
            ["FR-04", "Quản lý tổ chức", "Hệ thống cho phép quản lý đơn vị tổ chức, phòng ban và mối liên hệ giữa phòng ban với nhân viên."],
            ["FR-05", "Quản lý nhân viên", "Người dùng có quyền có thể thêm, sửa, xóa, tìm kiếm và xem chi tiết hồ sơ nhân viên."],
            ["FR-06", "Quản lý bảng lương", "Hệ thống hỗ trợ tạo đợt tính lương, tính lương, lưu kết quả, phê duyệt, từ chối và xử lý bảng lương."],
            ["FR-07", "Quản lý dự án", "Người dùng có quyền có thể tạo dự án, cập nhật trạng thái, gán trưởng dự án và phân công nhân viên vào dự án."],
            ["FR-08", "Quản lý tác vụ", "Hệ thống cho phép tạo, cập nhật, phân công, lọc và theo dõi trạng thái tác vụ theo dự án hoặc người phụ trách."],
            ["FR-09", "Thông báo và sự kiện", "Các sự kiện quan trọng như tạo dự án, giao việc hoặc thay đổi trạng thái được phát sinh để service liên quan xử lý."],
            ["FR-10", "Báo cáo/tra cứu", "Người dùng có thể tra cứu dữ liệu theo danh sách, bộ lọc và màn hình chi tiết để phục vụ quản trị."],
        ], (1450, 2100, 6050)),
        paragraph("Bảng 3.0: Danh sách yêu cầu chức năng của hệ thống", "MdSpace"),
        paragraph("3.0.2. Yêu cầu phi chức năng", "Heading30"),
        table([
            ["Nhóm yêu cầu", "Mô tả", "Cách đáp ứng trong hệ thống"],
            ["Bảo mật", "Bảo vệ tài khoản, token và API nghiệp vụ khỏi truy cập trái phép.", "Sử dụng JWT, RBAC, API Gateway, kiểm tra quyền ở cả frontend và backend."],
            ["Hiệu năng", "Các API đọc dữ liệu thông thường cần phản hồi nhanh và ổn định.", "Tối ưu truy vấn, phân trang danh sách, sử dụng Redis cho dữ liệu thường truy cập."],
            ["Khả năng mở rộng", "Có thể mở rộng từng module khi nhu cầu sử dụng tăng.", "Áp dụng Microservices, mỗi service có database riêng và có thể scale độc lập."],
            ["Tính sẵn sàng", "Lỗi ở một service không làm dừng toàn bộ hệ thống.", "Tách service, dùng Eureka để khám phá dịch vụ và Docker Compose để khởi động lại thành phần lỗi."],
            ["Khả năng bảo trì", "Mã nguồn cần dễ chia module, kiểm thử và nâng cấp.", "Tổ chức theo service, controller, service, repository, DTO, entity và component frontend."],
            ["Khả năng quan sát", "Có thể theo dõi health, log, metrics và trạng thái vận hành.", "Dùng actuator health, Docker logs, Prometheus, Grafana và Jaeger."],
            ["Toàn vẹn dữ liệu", "Dữ liệu nghiệp vụ phải nhất quán trong phạm vi từng service.", "Database-per-service, ràng buộc khóa chính, trường trạng thái và lịch sử thay đổi."],
        ], (2100, 3650, 3850)),
        paragraph("Bảng 3.1: Danh sách yêu cầu phi chức năng của hệ thống", "MdSpace"),
    ])


def database_details() -> str:
    return "".join([
        paragraph("3.3.3. Mô tả chi tiết các bảng cơ sở dữ liệu", "Heading30"),
        paragraph("Các bảng dữ liệu được thiết kế theo nguyên tắc mỗi service sở hữu cơ sở dữ liệu riêng. Vì vậy, quan hệ giữa các service không dùng khóa ngoại vật lý xuyên database, mà sử dụng mã định danh logic và đồng bộ thông qua API hoặc sự kiện. Cách thiết kế này giúp từng service độc lập hơn trong triển khai, bảo trì và mở rộng."),
        paragraph("3.3.3.1. Nhóm bảng Auth DB", "MdHeading4"),
        table([
            ["Bảng", "Mục đích", "Các trường/quan hệ chính"],
            ["NGUOI_DUNG", "Lưu thông tin tài khoản đăng nhập và trạng thái bảo mật của người dùng.", "id, username, password_hash, email, full_name, enabled, locked, role; liên kết logic đến NHAN_VIEN qua user_id hoặc username."],
            ["VAI_TRO", "Định nghĩa vai trò và tập quyền được phép thực hiện trong hệ thống.", "id, name, description, permissions; được dùng khi kiểm tra RBAC ở backend và frontend."],
            ["LICH_SU_MAT_KHAU", "Lưu lịch sử mật khẩu để kiểm soát chính sách đổi mật khẩu.", "id, user_id, password_hash, created_at; liên hệ với NGUOI_DUNG theo user_id."],
            ["HANG_DOI_DONG_BO_NGUOI_DUNG", "Lưu các yêu cầu đồng bộ tài khoản sang service khác.", "id, user_id, payload, status, retry_count, created_at, updated_at."],
            ["HANG_DOI_LOI_DONG_BO", "Lưu các bản ghi đồng bộ thất bại để phục vụ kiểm tra và xử lý lại.", "id, source_event_id, error_message, payload, created_at."],
        ], (2400, 3200, 4000)),
        paragraph("Bảng 3.6: Mô tả các bảng trong Auth DB", "MdSpace"),
        paragraph("3.3.3.2. Nhóm bảng HR DB", "MdHeading4"),
        table([
            ["Bảng", "Mục đích", "Các trường/quan hệ chính"],
            ["DON_VI_TO_CHUC", "Quản lý cơ cấu tổ chức theo dạng phân cấp.", "id, name, code, parent_id; parent_id cho phép biểu diễn đơn vị cha - con."],
            ["PHONG_BAN", "Quản lý phòng ban thuộc một đơn vị tổ chức.", "id, name, code, organization_unit_id; liên kết đến DON_VI_TO_CHUC."],
            ["NHAN_VIEN", "Lưu hồ sơ nhân viên và thông tin liên hệ với tài khoản xác thực.", "id, employee_code, full_name, email, phone, department_id, user_id, position, status."],
            ["SU_KIEN_DONG_BO_DA_XU_LY", "Ghi nhận sự kiện đồng bộ đã xử lý nhằm tránh xử lý trùng.", "id, event_id, event_type, processed_at."],
            ["DOT_TINH_LUONG", "Lưu thông tin kỳ/đợt tính lương.", "id, year_month, status, created_by, approved_by, created_at."],
            ["KET_QUA_LUONG", "Lưu kết quả tính lương theo từng nhân viên trong một kỳ.", "id, payroll_run_id, employee_id, gross_salary, deduction_total, tax_amount, net_salary, status."],
            ["LICH_SU_LUONG", "Lưu vết thay đổi trạng thái và thao tác xử lý bảng lương.", "id, payroll_result_id, old_status, new_status, action_by, action_at, note."],
            ["LOAI_KHAU_TRU", "Định nghĩa danh mục khoản khấu trừ.", "id, code, name, calculation_type, default_amount, active."],
            ["KHAU_TRU_NHAN_VIEN", "Cấu hình khoản khấu trừ áp dụng cho từng nhân viên.", "id, employee_id, deduction_type_id, amount, effective_from, effective_to."],
            ["CAU_HINH_THUE", "Lưu cấu hình thuế theo bậc, năm và quốc gia.", "id, country, year, income_from, income_to, tax_rate."],
        ], (2400, 3200, 4000)),
        paragraph("Bảng 3.7: Mô tả các bảng trong HR DB", "MdSpace"),
        paragraph("3.3.3.3. Nhóm bảng Project DB", "MdHeading4"),
        table([
            ["Bảng", "Mục đích", "Các trường/quan hệ chính"],
            ["DU_AN", "Lưu thông tin dự án, trạng thái và người phụ trách.", "id, name, description, status, start_date, end_date, lead_id; lead_id tham chiếu logic đến nhân viên."],
            ["PHAN_CONG_DU_AN", "Lưu thông tin nhân viên được phân công vào dự án.", "id, project_id, employee_id, role, active, assigned_at; project_id liên kết với DU_AN."],
        ], (2400, 3200, 4000)),
        paragraph("Bảng 3.8: Mô tả các bảng trong Project DB", "MdSpace"),
        paragraph("3.3.3.4. Nhóm bảng Task DB", "MdHeading4"),
        table([
            ["Bảng", "Mục đích", "Các trường/quan hệ chính"],
            ["CONG_VIEC", "Lưu thông tin công việc thuộc dự án và người được giao.", "id, title, description, status, priority, project_id, assignee_id, due_date, created_at."],
            ["LICH_SU_CONG_VIEC", "Lưu lịch sử thay đổi trạng thái, người phụ trách hoặc nội dung công việc.", "id, task_id, old_status, new_status, changed_by, changed_at, note; task_id liên kết với CONG_VIEC."],
        ], (2400, 3200, 4000)),
        paragraph("Bảng 3.9: Mô tả các bảng trong Task DB", "MdSpace"),
        paragraph("Nhìn chung, các bảng được tổ chức xoay quanh các aggregate chính của từng service. Auth DB tập trung vào tài khoản và quyền; HR DB tập trung vào hồ sơ nhân sự, cơ cấu tổ chức và bảng lương; Project DB quản lý dự án và phân công; Task DB quản lý công việc và lịch sử thay đổi. Thiết kế này phù hợp với kiến trúc Microservices vì giảm phụ thuộc trực tiếp giữa các module dữ liệu."),
    ])


def main() -> None:
    with zipfile.ZipFile(SRC, "r") as docx:
        existing = {name: docx.read(name) for name in docx.namelist()}

    document_xml = existing["word/document.xml"].decode("utf-8")
    if "2.3. Cơ sở xác định yêu cầu hệ thống" not in document_xml:
        document_xml = insert_before_paragraph(document_xml, "CHƯƠNG 3", chapter_2_requirements_base())
    if "3.0. Phân tích yêu cầu hệ thống" not in document_xml:
        document_xml = insert_after_paragraph(document_xml, "CHƯƠNG 3", chapter_3_requirements())
    if "3.3.3. Mô tả chi tiết các bảng cơ sở dữ liệu" not in document_xml:
        document_xml = insert_before_paragraph(document_xml, "3.4. Luồng xử lý chính", database_details())

    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as out_docx:
        for name, data in existing.items():
            if name == "word/document.xml":
                data = document_xml.encode("utf-8")
            out_docx.writestr(name, data)

    print(OUT.resolve())


if __name__ == "__main__":
    main()
