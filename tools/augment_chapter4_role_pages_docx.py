from __future__ import annotations

import html
import re
import zipfile
from pathlib import Path


SRC = Path("KTtmp_chuong4_chuong5_requirements_db.docx")
OUT = Path("KTtmp_chuong4_chuong5_requirements_db_roles.docx")


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
    return html.unescape("".join(re.sub(r"<[^>]+>", "", item) for item in texts))


def insert_before_paragraph(document_xml: str, needle: str, insert_xml: str) -> str:
    pattern = re.compile(r"<w:p(?:\s[^>]*)?>[\s\S]*?</w:p>")
    for match in pattern.finditer(document_xml):
        if needle in text_from_paragraph_xml(match.group(0)):
            return document_xml[: match.start()] + insert_xml + document_xml[match.start() :]
    raise ValueError(f"Could not find paragraph containing: {needle}")


def replace_paragraph_text(document_xml: str, old: str, new: str) -> str:
    return document_xml.replace(
        f'<w:t xml:space="preserve">{esc(old)}</w:t>',
        f'<w:t xml:space="preserve">{esc(new)}</w:t>',
        1,
    )


def role_pages_section() -> str:
    return "".join([
        paragraph("4.4. Giao diện theo từng vai trò người dùng", "h2"),
        paragraph("Hệ thống không hiển thị toàn bộ chức năng cho mọi tài khoản. Sau khi đăng nhập, frontend xác định vai trò người dùng thông qua thông tin roles trong token/tài khoản, sau đó kết hợp với danh sách permission để quyết định menu, route và nút thao tác được phép hiển thị. Cách tổ chức này giúp mỗi nhóm người dùng chỉ nhìn thấy các trang liên quan đến công việc của mình, giảm nhầm lẫn khi thao tác và tăng mức độ an toàn khi vận hành."),
        paragraph("Các vai trò chính trong hệ thống bao gồm: Quản trị viên hệ thống, Nhân sự, Nhân viên bảng lương, Trưởng phòng, Quản lý nhóm, Nhân viên và Người dùng thông thường. Mỗi vai trò có một workspace riêng, bộ trang ưu tiên riêng và phạm vi thao tác khác nhau."),
        paragraph("4.4.1. Tổng hợp trang theo vai trò", "Heading30"),
        table([
            ["Vai trò", "Các trang/menu chính", "Mục đích sử dụng"],
            ["Admin", "Trang chủ, My Dashboard, Project Board, Task Management, Approvals, Analytics, Identity & Access, Tài khoản, Vai trò, Tổ chức, Nhân viên, Phòng ban, Bảng lương, Dự án, Task", "Quản trị toàn bộ hệ thống, tài khoản, vai trò, quyền truy cập, dữ liệu danh mục và giám sát hoạt động."],
            ["HR Manager", "Trang chủ, Tổ chức, Nhân viên, Phòng ban, Bảng lương, Dự án, Task, Tài khoản, Hồ sơ nhân sự, Phúc lợi", "Quản lý hồ sơ nhân sự, cơ cấu tổ chức, phòng ban, dữ liệu phục vụ bảng lương và hỗ trợ quản trị tài khoản nhân sự."],
            ["Payroll Officer", "Trang chủ, Bảng lương, Nhân viên, Báo cáo payroll", "Tạo kỳ lương, tính lương, duyệt/xử lý bảng lương và đối soát dữ liệu nhân viên liên quan đến chi trả."],
            ["Department Head", "Trang chủ, My Dashboard, My Tasks, Project Board, Approvals, Analytics, Timeline, Tổ chức, Nhân viên, Phòng ban, Dự án, Task, Phê duyệt phòng ban, Báo cáo phòng ban", "Theo dõi hoạt động cấp phòng ban, phê duyệt yêu cầu, xem báo cáo, theo dõi nhân sự và tiến độ công việc của phòng ban."],
            ["Manager", "Trang chủ, My Dashboard, My Tasks, Project Board, Task Management, Approvals, Analytics, Timeline, Nhân viên, Phòng ban, Dự án, Task, Duyệt timesheet, Task nhóm", "Điều phối task nhóm, theo dõi tiến độ dự án, phê duyệt công việc/timesheet và quản lý nhân viên trong phạm vi nhóm."],
            ["Employee", "Trang chủ, My Dashboard, My Tasks, Project Board, Notifications, Discussions, Files, Activity Log, Dự án, Task, Chấm công, Nghỉ phép, Task cá nhân", "Theo dõi công việc cá nhân, dự án được tham gia, chấm công, nghỉ phép và các thông báo liên quan."],
            ["User", "Trang chủ, Hồ sơ cá nhân, Đổi mật khẩu, Tài khoản của tôi", "Quản lý thông tin tài khoản cá nhân, bảo mật mật khẩu và xem phạm vi quyền truy cập hiện tại."],
        ], (1800, 3900, 3900)),
        paragraph("Bảng 4.4: Phân nhóm trang giao diện theo từng vai trò người dùng", "MdSpace"),
        paragraph("4.4.2. Giao diện dành cho Quản trị viên hệ thống", "Heading30"),
        paragraph("Quản trị viên hệ thống là vai trò có phạm vi truy cập rộng nhất. Nhóm trang quan trọng nhất của Admin gồm Tài khoản, Vai trò, Identity & Access, Nhân viên, Phòng ban, Tổ chức, Dự án, Task và Bảng lương. Admin có thể tạo hoặc khóa tài khoản, chỉnh vai trò, kiểm soát quyền, theo dõi dữ liệu danh mục và hỗ trợ xử lý các tình huống sai phân quyền."),
        table([
            ["Trang", "Route", "Thao tác chính"],
            ["Quản lý tài khoản", "/users", "Xem danh sách tài khoản, tạo/cập nhật tài khoản, khóa hoặc mở khóa người dùng."],
            ["Quản lý vai trò", "/roles", "Xem danh sách vai trò, cấu hình quyền và kiểm tra số lượng người dùng theo vai trò."],
            ["Identity & Access", "/work/admin", "Theo dõi các điểm quản trị truy cập, audit và cấu hình bảo mật."],
            ["Các trang nghiệp vụ", "/employees, /departments, /projects, /tasks, /payroll", "Xem và hỗ trợ quản trị dữ liệu nghiệp vụ khi cần."],
        ], (2600, 2400, 4600)),
        paragraph("Bảng 4.5: Các trang chính dành cho Admin", "MdSpace"),
        paragraph("4.4.3. Giao diện dành cho bộ phận Nhân sự", "Heading30"),
        paragraph("Nhân sự tập trung vào dữ liệu con người và cơ cấu tổ chức. Các trang chính gồm Nhân viên, Phòng ban, Tổ chức, Hồ sơ nhân sự, Phúc lợi và một số trang hỗ trợ như Dự án, Task, Bảng lương. Vai trò này không cần toàn quyền hệ thống như Admin, nhưng cần quyền đủ rộng để quản lý dữ liệu nhân sự chính xác."),
        table([
            ["Trang", "Route", "Thao tác chính"],
            ["Hồ sơ nhân viên", "/employees hoặc /workspace/hr-records", "Thêm, sửa, tra cứu hồ sơ nhân viên và kiểm tra trạng thái làm việc."],
            ["Phòng ban", "/departments", "Quản lý phòng ban, người phụ trách và liên kết nhân viên."],
            ["Đơn vị tổ chức", "/organizations", "Theo dõi cơ cấu đơn vị cha - con và cấu trúc doanh nghiệp."],
            ["Phúc lợi", "/workspace/benefits", "Rà soát thông tin phúc lợi, phụ cấp và dữ liệu hỗ trợ payroll."],
        ], (2600, 2700, 4300)),
        paragraph("Bảng 4.6: Các trang chính dành cho HR Manager", "MdSpace"),
        paragraph("4.4.4. Giao diện dành cho Nhân viên bảng lương", "Heading30"),
        paragraph("Nhân viên bảng lương cần giao diện tập trung vào kỳ lương, kết quả lương và đối soát dữ liệu nhân viên. Vai trò này được cấp quyền xem nhân viên và quản lý payroll, nhưng không cần quyền quản trị tài khoản hay vai trò."),
        table([
            ["Trang", "Route", "Thao tác chính"],
            ["Bảng lương", "/payroll", "Tạo kỳ lương, tính lương, phê duyệt, từ chối và xử lý chi trả."],
            ["Hồ sơ nhân viên", "/employees", "Xem thông tin nhân viên để đối soát dữ liệu tính lương."],
            ["Báo cáo payroll", "/payroll", "Theo dõi các kỳ lương đã xử lý và trạng thái kết quả lương."],
        ], (2600, 2700, 4300)),
        paragraph("Bảng 4.7: Các trang chính dành cho Payroll Officer", "MdSpace"),
        paragraph("4.4.5. Giao diện dành cho Trưởng phòng và Quản lý", "Heading30"),
        paragraph("Trưởng phòng và Quản lý là nhóm người dùng cần theo dõi tiến độ đội nhóm. Giao diện của hai vai trò này ưu tiên My Dashboard, My Tasks, Project Board, Task Management, Approvals, Analytics, Timeline, Task nhóm và các trang phê duyệt. Trưởng phòng có thêm góc nhìn báo cáo/phê duyệt cấp phòng ban, trong khi Manager tập trung vào task nhóm và timesheet."),
        table([
            ["Vai trò", "Trang/route", "Thao tác chính"],
            ["Department Head", "/workspace/approvals, /workspace/department-reports", "Phê duyệt cấp phòng ban, xem báo cáo phòng ban, theo dõi nhân sự và tải công việc."],
            ["Manager", "/workspace/timesheet-approval, /workspace/team-tasks", "Duyệt timesheet, điều phối task nhóm, theo dõi tiến độ và deadline."],
            ["Cả hai", "/work, /work/board, /projects, /tasks", "Xem dashboard công việc, bảng dự án, danh sách dự án và danh sách tác vụ."],
        ], (2300, 3100, 4200)),
        paragraph("Bảng 4.8: Các trang chính dành cho Department Head và Manager", "MdSpace"),
        paragraph("4.4.6. Giao diện dành cho Nhân viên", "Heading30"),
        paragraph("Nhân viên chỉ cần các trang phục vụ công việc cá nhân. Sau khi đăng nhập, nhân viên có thể xem dashboard cá nhân, task được giao, dự án tham gia, thông báo, file, lịch sử hoạt động, chấm công và nghỉ phép. Các trang quản trị như User, Role hoặc Payroll không hiển thị cho vai trò này."),
        table([
            ["Trang", "Route", "Thao tác chính"],
            ["My Tasks", "/work/my-tasks", "Xem task được giao, trạng thái, deadline và mức ưu tiên."],
            ["Project Board", "/work/board", "Theo dõi dự án mà nhân viên tham gia."],
            ["Chấm công", "/workspace/timekeeping", "Theo dõi ngày công, giờ làm và ghi chú chấm công."],
            ["Nghỉ phép", "/workspace/leave", "Tạo yêu cầu nghỉ phép và xem trạng thái phê duyệt."],
            ["Task cá nhân", "/workspace/personal-tasks", "Xem danh sách công việc cá nhân cần hoàn thành."],
        ], (2600, 2700, 4300)),
        paragraph("Bảng 4.9: Các trang chính dành cho Employee", "MdSpace"),
        paragraph("4.4.7. Giao diện dành cho Người dùng thông thường", "Heading30"),
        paragraph("Người dùng thông thường là tài khoản chưa được gán vai trò nghiệp vụ sâu hoặc chỉ cần quản lý thông tin cá nhân. Hệ thống chỉ hiển thị các trang an toàn như Hồ sơ cá nhân, Đổi mật khẩu và Tài khoản của tôi. Cách giới hạn này tránh việc người dùng truy cập nhầm vào dữ liệu nhân sự, dự án hoặc bảng lương."),
        table([
            ["Trang", "Route", "Thao tác chính"],
            ["Hồ sơ cá nhân", "/profile", "Xem thông tin tài khoản, email, vai trò và trạng thái tài khoản."],
            ["Đổi mật khẩu", "/change-password", "Cập nhật mật khẩu để bảo vệ tài khoản."],
            ["Tài khoản của tôi", "/workspace/account-security", "Xem phạm vi quyền truy cập và trạng thái bảo mật cá nhân."],
        ], (2600, 2700, 4300)),
        paragraph("Bảng 4.10: Các trang chính dành cho User", "MdSpace"),
        paragraph("4.4.8. Nguyên tắc kiểm soát hiển thị trang và thao tác", "Heading30"),
        paragraph("Việc hiển thị trang dựa trên hai lớp kiểm soát. Lớp thứ nhất là vai trò, dùng để xác định nhóm trải nghiệm và menu phù hợp. Lớp thứ hai là permission, dùng để quyết định người dùng có được truy cập route hoặc thực hiện thao tác cụ thể như thêm, sửa, xóa, duyệt hay quản trị hay không."),
        paragraph("Ví dụ, cùng nhìn thấy module công việc nhưng Employee chủ yếu xem task cá nhân, Manager có thể tạo và điều phối task nhóm, còn Admin có thể truy cập thêm các trang quản trị liên quan. Điều này giúp giao diện phản ánh đúng trách nhiệm thực tế của từng người dùng trong doanh nghiệp."),
    ])


def main() -> None:
    with zipfile.ZipFile(SRC, "r") as docx:
        existing = {name: docx.read(name) for name in docx.namelist()}

    document_xml = existing["word/document.xml"].decode("utf-8")
    if "4.4. Giao diện theo từng vai trò người dùng" not in document_xml:
        document_xml = insert_before_paragraph(
            document_xml,
            "4.4. Triển khai kết nối API và bảo vệ route",
            role_pages_section(),
        )
        document_xml = replace_paragraph_text(
            document_xml,
            "4.4. Triển khai kết nối API và bảo vệ route",
            "4.5. Triển khai kết nối API và bảo vệ route",
        )
        document_xml = replace_paragraph_text(
            document_xml,
            "4.5. Triển khai đóng gói và vận hành",
            "4.6. Triển khai đóng gói và vận hành",
        )

    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as out_docx:
        for name, data in existing.items():
            if name == "word/document.xml":
                data = document_xml.encode("utf-8")
            out_docx.writestr(name, data)

    print(OUT.resolve())


if __name__ == "__main__":
    main()
