from __future__ import annotations

import binascii
import html
import re
import struct
import zipfile
import zlib
from pathlib import Path


SRC = Path("KTtmp_working.docx")
OUT = Path("KTtmp_chuong4_chuong5_fixed.docx")
MEDIA_START = 18


def esc(value: str) -> str:
    return html.escape(value, quote=True)


def paragraph(
    text: str = "",
    style: str = "noidung",
    *,
    italic: bool = False,
    align: str | None = None,
    page_break: bool = False,
) -> str:
    ppr = []
    if style:
        ppr.append(f'<w:pStyle w:val="{esc(style)}"/>')
    if align:
        ppr.append(f'<w:jc w:val="{align}"/>')
    ppr_xml = f"<w:pPr>{''.join(ppr)}</w:pPr>" if ppr else ""
    rpr = "<w:rPr><w:i/></w:rPr>" if italic else ""
    br = '<w:r><w:br w:type="page"/></w:r>' if page_break else ""
    run = f'<w:r>{rpr}<w:t xml:space="preserve">{esc(text)}</w:t></w:r>' if text else ""
    return f"<w:p>{ppr_xml}{br}{run}</w:p>"


def table(rows: list[list[str]], widths: tuple[int, int, int] = (2200, 5200, 2600)) -> str:
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


def png_chunk(tag: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", binascii.crc32(tag + data) & 0xFFFFFFFF)


def make_png(theme: str) -> bytes:
    width, height = 1000, 560
    palettes = {
        "login": ((248, 250, 252), (14, 116, 144), (226, 232, 240)),
        "dashboard": ((248, 250, 252), (15, 23, 42), (34, 211, 238)),
        "employee": ((255, 255, 255), (8, 145, 178), (226, 232, 240)),
        "org": ((248, 250, 252), (37, 99, 235), (219, 234, 254)),
        "project": ((250, 250, 249), (79, 70, 229), (224, 231, 255)),
        "payroll": ((255, 251, 235), (180, 83, 9), (254, 243, 199)),
        "admin": ((248, 250, 252), (124, 58, 237), (237, 233, 254)),
        "profile": ((255, 255, 255), (22, 101, 52), (220, 252, 231)),
    }
    bg, accent, soft = palettes[theme]
    pixels = [[bg for _ in range(width)] for _ in range(height)]

    def rect(x1: int, y1: int, x2: int, y2: int, color: tuple[int, int, int]) -> None:
        for y in range(max(0, y1), min(height, y2)):
            for x in range(max(0, x1), min(width, x2)):
                pixels[y][x] = color

    def outline(x1: int, y1: int, x2: int, y2: int, color: tuple[int, int, int]) -> None:
        rect(x1, y1, x2, y1 + 3, color)
        rect(x1, y2 - 3, x2, y2, color)
        rect(x1, y1, x1 + 3, y2, color)
        rect(x2 - 3, y1, x2, y2, color)

    rect(0, 0, width, 54, (241, 245, 249))
    rect(130, 16, 860, 38, (255, 255, 255))
    if theme == "login":
        rect(0, 54, 520, height, soft)
        rect(600, 120, 900, 440, (255, 255, 255))
        outline(600, 120, 900, 440, (203, 213, 225))
        rect(640, 170, 860, 196, accent)
        rect(640, 235, 860, 276, (241, 245, 249))
        rect(640, 296, 860, 337, (241, 245, 249))
        rect(640, 365, 860, 410, accent)
    else:
        rect(0, 54, 220, height, (15, 23, 42))
        rect(245, 78, 960, 128, (255, 255, 255))
        rect(275, 92, 470, 112, accent)
        for i in range(7):
            rect(28, 92 + i * 48, 190, 122 + i * 48, accent if i == 0 else (51, 65, 85))
        if theme == "dashboard":
            for i in range(4):
                rect(245 + i * 178, 155, 400 + i * 178, 245, soft)
            rect(245, 280, 610, 505, (255, 255, 255))
            outline(245, 280, 610, 505, (203, 213, 225))
            rect(645, 280, 960, 505, (255, 255, 255))
            outline(645, 280, 960, 505, (203, 213, 225))
        elif theme in {"employee", "org", "project", "admin"}:
            rect(245, 150, 960, 198, soft)
            rect(260, 165, 420, 184, accent)
            rect(245, 220, 960, 500, (255, 255, 255))
            outline(245, 220, 960, 500, (203, 213, 225))
            for y in range(260, 475, 42):
                rect(270, y, 930, y + 1, (226, 232, 240))
                rect(270, y + 12, 430, y + 25, (203, 213, 225))
                rect(520, y + 12, 720, y + 25, (226, 232, 240))
                rect(820, y + 10, 910, y + 28, soft)
        elif theme == "payroll":
            rect(245, 150, 585, 285, (255, 255, 255))
            outline(245, 150, 585, 285, (245, 158, 11))
            rect(620, 150, 960, 285, (255, 255, 255))
            outline(620, 150, 960, 285, (245, 158, 11))
            rect(245, 315, 960, 500, (255, 255, 255))
            outline(245, 315, 960, 500, (203, 213, 225))
        elif theme == "profile":
            rect(260, 150, 420, 310, soft)
            rect(290, 185, 390, 285, accent)
            rect(455, 150, 960, 310, (255, 255, 255))
            outline(455, 150, 960, 310, (203, 213, 225))
            rect(455, 345, 960, 500, (255, 255, 255))
            outline(455, 345, 960, 500, (203, 213, 225))

    raw = b"".join(b"\x00" + bytes(value for pixel in row for value in pixel) for row in pixels)
    return (
        b"\x89PNG\r\n\x1a\n"
        + png_chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0))
        + png_chunk(b"IDAT", zlib.compress(raw, 9))
        + png_chunk(b"IEND", b"")
    )


def image_paragraph(rid: str, name: str, docpr_id: int) -> str:
    cx, cy = 5486400, 3070860
    return (
        '<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:drawing>'
        '<wp:inline distT="0" distB="0" distL="0" distR="0">'
        f'<wp:extent cx="{cx}" cy="{cy}"/><wp:effectExtent l="0" t="0" r="0" b="0"/>'
        f'<wp:docPr id="{docpr_id}" name="{esc(name)}"/>'
        '<wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr>'
        '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">'
        '<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">'
        '<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">'
        f'<pic:nvPicPr><pic:cNvPr id="0" name="{esc(name)}"/><pic:cNvPicPr/></pic:nvPicPr>'
        f'<pic:blipFill><a:blip r:embed="{rid}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/>'
        '<a:stretch><a:fillRect/></a:stretch></pic:blipFill>'
        f'<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="{cx}" cy="{cy}"/></a:xfrm>'
        '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>'
        '</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>'
    )


def build_insert_xml(image_info: list[tuple[str, str, str]]) -> str:
    parts = [
        paragraph("", page_break=True),
        paragraph("CHƯƠNG 4: TRIỂN KHAI HỆ THỐNG", "H1"),
        paragraph("4.1. Môi trường và phạm vi triển khai", "h2"),
        paragraph("Hệ thống được triển khai theo mô hình ứng dụng web nhiều lớp, trong đó giao diện người dùng được xây dựng bằng React, TypeScript và Vite; các dịch vụ nghiệp vụ được phát triển bằng Spring Boot; dữ liệu được lưu trữ phân tách theo từng dịch vụ với PostgreSQL và MySQL. Các thành phần hạ tầng như API Gateway, Eureka Server, Redis, RabbitMQ, Prometheus, Grafana và Docker Compose hỗ trợ định tuyến, khám phá dịch vụ, caching, truyền thông bất đồng bộ, giám sát và đóng gói triển khai."),
        paragraph("Trong phạm vi đề tài, quá trình triển khai tập trung vào các module chính: xác thực và phân quyền, quản lý nhân sự, quản lý phòng ban và đơn vị tổ chức, quản lý dự án, quản lý tác vụ, quản lý bảng lương, quản trị người dùng và quản trị vai trò."),
        paragraph("4.2. Cấu trúc giao diện người dùng", "h2"),
        paragraph("Giao diện frontend được tổ chức theo kiến trúc component, giúp tái sử dụng các thành phần chung và tách biệt phần hiển thị với phần gọi API. Các trang được lazy-load để giảm kích thước bundle ban đầu, còn các route nghiệp vụ được bảo vệ bằng ProtectedRoute dựa trên quyền của người dùng."),
        table([
            ["Nhóm thành phần", "Thành phần triển khai", "Vai trò trong hệ thống"],
            ["Layout", "MainLayout, Sidebar, Header", "Tạo khung làm việc chung, menu theo vai trò, khu vực nội dung chính và thao tác đăng xuất."],
            ["Bảo vệ truy cập", "ProtectedRoute, PermissionGate, ProtectedButton", "Kiểm tra đăng nhập, quyền truy cập route và quyền thao tác trên nút chức năng."],
            ["UI dùng chung", "Button, Input, Table, Badge, Modal, EmptyState, Toast", "Chuẩn hóa giao diện nhập liệu, bảng dữ liệu, trạng thái rỗng, phản hồi lỗi và thông báo."],
            ["API client", "authApi, employeeApi, departmentApi, organizationApi, projectApi, taskApi, payrollApi, roleApi", "Đóng gói lời gọi HTTP đến API Gateway và chuẩn hóa dữ liệu trả về cho từng module."],
            ["State và tiện ích", "authStore, uiStore, storage, axios interceptor", "Lưu phiên đăng nhập, token, trạng thái UI và xử lý lỗi API tập trung."],
        ]),
        paragraph("Bảng 4.1: Các nhóm thành phần chính của frontend", "MdSpace"),
        paragraph("4.3. Triển khai các trang chức năng", "h2"),
        paragraph("Các trang chức năng được xây dựng theo nguyên tắc mỗi trang phụ trách một nghiệp vụ rõ ràng. Với các trang dạng danh sách, hệ thống cung cấp thao tác xem, tìm kiếm/lọc, thêm mới, cập nhật và xóa tùy theo quyền người dùng. Với các trang dạng biểu mẫu, dữ liệu đầu vào được kiểm tra trước khi gửi đến API."),
        table([
            ["Trang", "Route chính", "Thành phần/chức năng cần ghi chú khi chèn ảnh"],
            ["Đăng nhập", "/login", "Form tài khoản, mật khẩu, xử lý token và điều hướng sau đăng nhập."],
            ["Trang tổng quan", "/", "Thẻ thống kê, khu vực điều hướng nhanh, trạng thái công việc theo vai trò."],
            ["Nhân viên", "/employees", "Bảng nhân viên, tìm kiếm, xem chi tiết, thêm/sửa/xóa theo quyền."],
            ["Phòng ban và tổ chức", "/departments, /organizations", "Danh sách phòng ban, cây đơn vị tổ chức, liên kết nhân viên với phòng ban."],
            ["Dự án và tác vụ", "/projects, /tasks, /work", "Quản lý dự án, phân công nhân sự, tạo tác vụ, theo dõi trạng thái và độ ưu tiên."],
            ["Bảng lương", "/payroll", "Tạo đợt tính lương, tính lương, duyệt, từ chối và xử lý bảng lương."],
            ["Người dùng và vai trò", "/users, /roles", "Quản trị tài khoản, cấu hình vai trò và danh sách quyền RBAC."],
            ["Hồ sơ cá nhân", "/profile, /change-password", "Xem thông tin tài khoản, đổi mật khẩu và quản lý phiên cá nhân."],
        ]),
        paragraph("Bảng 4.2: Danh sách trang giao diện và thành phần cần minh họa", "MdSpace"),
    ]

    descriptions = {
        "Giao diện đăng nhập": "Trang đăng nhập là điểm vào của hệ thống, tiếp nhận thông tin xác thực và gọi API đăng nhập để nhận JWT. Sau khi đăng nhập thành công, token được lưu vào storage và được gắn vào các request tiếp theo thông qua axios interceptor.",
        "Trang tổng quan": "Trang tổng quan cung cấp cái nhìn nhanh về trạng thái hệ thống và các công việc quan trọng theo vai trò đăng nhập. Đây là màn hình giúp người dùng đi nhanh đến module nghiệp vụ cần xử lý.",
        "Quản lý nhân viên": "Trang quản lý nhân viên hiển thị danh sách hồ sơ nhân sự, hỗ trợ xem chi tiết, thêm mới, cập nhật và xóa nhân viên. Các thao tác này được ràng buộc bởi quyền EMPLOYEE_VIEW, EMPLOYEE_CREATE, EMPLOYEE_UPDATE và EMPLOYEE_DELETE.",
        "Quản lý phòng ban và tổ chức": "Nhóm trang phòng ban và tổ chức giúp mô hình hóa cơ cấu doanh nghiệp. Đơn vị tổ chức có thể biểu diễn dạng cây, trong khi phòng ban liên kết với đơn vị tổ chức và nhân viên.",
        "Quản lý dự án và tác vụ": "Nhóm trang dự án và tác vụ phục vụ lập kế hoạch, phân công nhân viên vào dự án, tạo công việc, theo dõi người phụ trách, mức ưu tiên và trạng thái xử lý.",
        "Quản lý bảng lương": "Trang bảng lương hỗ trợ tạo đợt tính lương, tính toán kết quả lương, phê duyệt, từ chối và xử lý chi trả. Các bước này có ý nghĩa kiểm soát nghiệp vụ và phục vụ truy vết lịch sử.",
        "Quản trị người dùng và vai trò": "Trang quản trị người dùng và vai trò dành cho quản trị viên, cho phép quản lý tài khoản, định nghĩa vai trò và gán tập quyền theo mô hình RBAC.",
        "Hồ sơ cá nhân": "Trang hồ sơ cá nhân và đổi mật khẩu cho phép người dùng xem thông tin đăng nhập, cập nhật thông tin cơ bản và thay đổi mật khẩu nhằm đảm bảo an toàn tài khoản.",
    }
    for index, (rid, title, caption) in enumerate(image_info, 1):
        parts.extend([
            paragraph(f"4.3.{index}. {title}", "Heading30"),
            paragraph(descriptions[title]),
            image_paragraph(rid, title, 900 + index),
            paragraph(caption, italic=True, align="center"),
            paragraph("Ghi chú thay ảnh: thay khung minh họa này bằng ảnh chụp màn hình thực tế của trang tương ứng sau khi hệ thống frontend và dữ liệu demo đã chạy ổn định.", italic=True),
        ])

    parts.extend([
        paragraph("4.4. Triển khai kết nối API và bảo vệ route", "h2"),
        paragraph("Frontend không gọi trực tiếp từng service nội bộ mà gửi request thông qua API Gateway. API Gateway chịu trách nhiệm định tuyến đến Auth Service, HR Service, Project Service, Task Service và Payroll endpoint tương ứng. Mỗi request cần xác thực được gắn JWT trong header Authorization, giúp backend kiểm tra danh tính và quyền truy cập."),
        paragraph("Cơ chế ProtectedRoute ở frontend giúp ngăn người dùng truy cập trang không phù hợp ngay từ lớp giao diện. Tuy nhiên, việc kiểm tra quyền ở frontend chỉ đóng vai trò hỗ trợ trải nghiệm; quyền truy cập chính thức vẫn được kiểm tra ở backend thông qua JWT, role và permission."),
        paragraph("4.5. Triển khai đóng gói và vận hành", "h2"),
        paragraph("Các service được đóng gói bằng Docker, cấu hình qua Docker Compose và có thể khởi động theo từng cụm: hạ tầng, IAM, HR, Business và Edge. Cách tách cụm này giúp giảm ảnh hưởng chéo khi phát triển, kiểm thử hoặc khởi động lại một nhóm service cụ thể."),
        table([
            ["Cụm triển khai", "Thành phần", "Mục đích"],
            ["Infra", "Eureka, Redis, Prometheus, Grafana, Jaeger, HAProxy", "Cung cấp khám phá dịch vụ, cache và quan sát hệ thống."],
            ["IAM", "Auth Service, KMS Service, PostgreSQL", "Xác thực, phân quyền, phát hành/kiểm tra token và quản lý khóa."],
            ["HR", "HR Service, MySQL", "Quản lý nhân sự, phòng ban, tổ chức và bảng lương."],
            ["Business", "Project Service, Task Service, MySQL, RabbitMQ", "Quản lý dự án, công việc và sự kiện nghiệp vụ."],
            ["Edge", "API Gateway, Frontend", "Cổng vào API và giao diện người dùng."],
        ]),
        paragraph("Bảng 4.3: Cấu trúc triển khai theo cụm service", "MdSpace"),
        paragraph("", page_break=True),
        paragraph("CHƯƠNG 5: KIỂM THỬ, ĐÁNH GIÁ VÀ HƯỚNG PHÁT TRIỂN", "H1"),
        paragraph("5.1. Mục tiêu kiểm thử", "h2"),
        paragraph("Mục tiêu của quá trình kiểm thử là xác nhận hệ thống đáp ứng đúng các yêu cầu chức năng, đảm bảo các service có thể khởi động, đăng ký với Eureka, kết nối cơ sở dữ liệu, xử lý request qua API Gateway và áp dụng phân quyền phù hợp với từng vai trò."),
        paragraph("Quá trình kiểm thử được thực hiện theo nhiều mức: kiểm thử đơn vị cho service, kiểm thử tích hợp giữa các service, kiểm thử API qua gateway, kiểm thử giao diện người dùng và kiểm thử vận hành bằng Docker Compose."),
        paragraph("5.2. Kiểm thử chức năng chính", "h2"),
        table([
            ["Nhóm kiểm thử", "Kịch bản", "Kết quả mong đợi"],
            ["Xác thực", "Đăng nhập đúng/sai thông tin, kiểm tra token, đổi mật khẩu", "Trả token hợp lệ khi đăng nhập đúng; trả lỗi 4xx rõ ràng khi sai thông tin hoặc thiếu quyền."],
            ["Nhân sự", "Thêm, sửa, xóa, tìm kiếm nhân viên; xem chi tiết nhân viên", "Dữ liệu được lưu đúng, validate đầu vào, danh sách cập nhật sau thao tác."],
            ["Phòng ban/tổ chức", "Tạo đơn vị tổ chức, tạo phòng ban, liên kết nhân viên", "Cấu trúc tổ chức hiển thị đúng và không phát sinh dữ liệu mồ côi."],
            ["Dự án/tác vụ", "Tạo dự án, phân công nhân viên, tạo tác vụ, đổi trạng thái", "Task gắn đúng project/assignee, trạng thái thay đổi hợp lệ và có lịch sử."],
            ["Bảng lương", "Tạo đợt tính lương, tính lương, duyệt/từ chối/xử lý", "Kết quả lương chính xác, workflow không cho nhảy trạng thái sai."],
            ["Phân quyền", "Truy cập route/API với vai trò khác nhau", "Người dùng chỉ xem/thao tác trong phạm vi quyền được cấp."],
        ]),
        paragraph("Bảng 5.1: Ma trận kiểm thử chức năng chính", "MdSpace"),
        paragraph("5.3. Kiểm thử tích hợp và vận hành", "h2"),
        paragraph("Kiểm thử tích hợp tập trung vào luồng liên service: người dùng đăng nhập qua Auth Service, nhận JWT, gửi request qua API Gateway, sau đó gateway định tuyến đến service nghiệp vụ. Với các luồng có sự kiện như đồng bộ người dùng hoặc thông báo tác vụ, RabbitMQ được sử dụng để tách rời quá trình phát sinh sự kiện và xử lý sự kiện."),
        table([
            ["Thành phần", "Cách kiểm tra", "Dấu hiệu đạt"],
            ["Eureka", "Mở dashboard hoặc kiểm tra log đăng ký service", "Các service xuất hiện với trạng thái UP."],
            ["API Gateway", "Gọi các endpoint qua cổng gateway", "Route đúng service, không phát sinh 5xx bất thường."],
            ["Database", "Kiểm tra kết nối và dữ liệu sau thao tác CRUD", "Bảng dữ liệu cập nhật đúng, không lỗi connection."],
            ["RabbitMQ", "Kiểm tra queue và log consumer", "Sự kiện được publish/consume đúng luồng."],
            ["Redis", "Kiểm tra health và log cache", "Cache hoạt động, không làm sai dữ liệu nghiệp vụ."],
            ["Frontend", "Mở từng route và thao tác form/list/detail", "Trang hiển thị đúng, không lỗi console nghiêm trọng."],
        ]),
        paragraph("Bảng 5.2: Kiểm thử tích hợp và vận hành hệ thống", "MdSpace"),
        paragraph("5.4. Đánh giá kết quả đạt được", "h2"),
        paragraph("Hệ thống đã xây dựng được nền tảng quản lý nhân sự theo kiến trúc Microservices với các service độc lập, cơ sở dữ liệu tách biệt và giao tiếp thông qua API Gateway/event. Các module nghiệp vụ cốt lõi gồm xác thực, nhân sự, tổ chức, phòng ban, dự án, tác vụ và bảng lương đã được tổ chức rõ ràng, phù hợp với phạm vi đề tài."),
        paragraph("Về giao diện, frontend đã cung cấp các trang chức năng chính, có cơ chế bảo vệ route, kiểm soát quyền hiển thị và tái sử dụng các component chung. Điều này giúp giao diện nhất quán, dễ mở rộng và thuận lợi khi bổ sung module mới."),
        paragraph("Về vận hành, việc đóng gói bằng Docker Compose giúp triển khai hệ thống thuận tiện hơn so với chạy thủ công từng service. Cấu trúc compose tách cụm cũng hỗ trợ kiểm thử từng phần và giảm thời gian khởi động khi chỉ cần làm việc với một nhóm service."),
        paragraph("5.5. Hạn chế còn tồn tại", "h2"),
        paragraph("Một số hạn chế còn tồn tại gồm: dữ liệu demo chưa bao phủ đầy đủ mọi tình huống nghiệp vụ; kiểm thử tải và kiểm thử bảo mật chuyên sâu chưa được thực hiện ở mức sản xuất; một số luồng phụ thuộc hạ tầng như Eureka hoặc RabbitMQ có thể làm service phía sau báo lỗi dây chuyền nếu chưa khởi động đúng thứ tự; giao diện vẫn cần bổ sung thêm ảnh chụp màn hình thực tế cho báo cáo sau khi môi trường demo ổn định."),
        paragraph("5.6. Hướng phát triển", "h2"),
        paragraph("Trong tương lai, hệ thống có thể được mở rộng theo các hướng sau: bổ sung kiểm thử end-to-end tự động cho các luồng quan trọng; triển khai CI/CD để tự động build, test và publish image; hoàn thiện dashboard quan sát lỗi và hiệu năng; bổ sung audit log chi tiết hơn cho các thao tác nhạy cảm; cải thiện workflow bảng lương theo nhiều chính sách doanh nghiệp; và chuẩn hóa bộ ảnh minh họa giao diện cho tài liệu bàn giao."),
        paragraph("5.7. Kết luận chương", "h2"),
        paragraph("Chương 5 đã trình bày cách kiểm thử, đánh giá kết quả triển khai và những hướng cải tiến tiếp theo của hệ thống. Nhìn chung, đề tài đã chứng minh được tính khả thi của việc áp dụng kiến trúc Microservices vào bài toán quản lý nhân sự, bảng lương, dự án và công việc trong doanh nghiệp vừa và nhỏ."),
    ])
    return "".join(parts)


def main() -> None:
    screens = [
        ("login", "Giao diện đăng nhập", "Hình 4.1: Giao diện đăng nhập hệ thống"),
        ("dashboard", "Trang tổng quan", "Hình 4.2: Trang tổng quan sau khi đăng nhập"),
        ("employee", "Quản lý nhân viên", "Hình 4.3: Trang danh sách và thao tác nhân viên"),
        ("org", "Quản lý phòng ban và tổ chức", "Hình 4.4: Trang quản lý phòng ban, đơn vị tổ chức"),
        ("project", "Quản lý dự án và tác vụ", "Hình 4.5: Trang quản lý dự án và công việc"),
        ("payroll", "Quản lý bảng lương", "Hình 4.6: Trang xử lý bảng lương"),
        ("admin", "Quản trị người dùng và vai trò", "Hình 4.7: Trang quản trị người dùng, vai trò và quyền"),
        ("profile", "Hồ sơ cá nhân", "Hình 4.8: Trang hồ sơ cá nhân và đổi mật khẩu"),
    ]
    media = {
        f"word/media/image{MEDIA_START + index}.png": make_png(theme)
        for index, (theme, _, _) in enumerate(screens)
    }

    with zipfile.ZipFile(SRC, "r") as docx:
        existing = {name: docx.read(name) for name in docx.namelist()}

    document_xml = existing["word/document.xml"].decode("utf-8")
    rels_xml = existing["word/_rels/document.xml.rels"].decode("utf-8")
    content_types_xml = existing["[Content_Types].xml"].decode("utf-8")

    next_rid = max(int(match.group(1)) for match in re.finditer(r'Id="rId(\d+)"', rels_xml)) + 1
    rel_entries = []
    image_info = []
    for index, (_, title, caption) in enumerate(screens):
        rid = f"rId{next_rid + index}"
        image_no = MEDIA_START + index
        rel_entries.append(
            f'<Relationship Id="{rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image{image_no}.png"/>'
        )
        image_info.append((rid, title, caption))
    rels_xml = rels_xml.replace("</Relationships>", "".join(rel_entries) + "</Relationships>")

    if 'Extension="png"' not in content_types_xml:
        content_types_xml = content_types_xml.replace(
            "</Types>", '<Default Extension="png" ContentType="image/png"/></Types>'
        )

    insert_xml = build_insert_xml(image_info)
    section_match = re.search(r"<w:sectPr[\s\S]*?</w:sectPr>\s*</w:body>", document_xml)
    if section_match:
        section_block = section_match.group(0).replace("</w:body>", "")
        document_xml = (
            document_xml[: section_match.start()]
            + insert_xml
            + section_block
            + "</w:body>"
            + document_xml[section_match.end() :]
        )
    else:
        document_xml = document_xml.replace("</w:body>", insert_xml + "</w:body>")

    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as out_docx:
        for name, data in existing.items():
            if name == "word/document.xml":
                data = document_xml.encode("utf-8")
            elif name == "word/_rels/document.xml.rels":
                data = rels_xml.encode("utf-8")
            elif name == "[Content_Types].xml":
                data = content_types_xml.encode("utf-8")
            if name not in media:
                out_docx.writestr(name, data)
        for name, data in media.items():
            out_docx.writestr(name, data)

    print(OUT.resolve())


if __name__ == "__main__":
    main()
