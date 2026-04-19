# Manage Students — Hệ thống quản lý sinh viên & nhân sự học thuật

Dự án gồm **API REST (Spring Boot)** và **ứng dụng web (Next.js)**, phục vụ quản lý người dùng, vai trò, phân quyền, khoa/viện, học phần, lớp học phần, đăng ký lớp, hồ sơ (bảo hiểm, hợp đồng lao động, chứng chỉ, công trình nghiên cứu, …) cùng tải lên tệp đính kèm.

## Công nghệ

| Thành phần | Công nghệ |
|------------|-----------|
| Backend | Java 17, Spring Boot 3.5, Spring Security, JWT (jjwt), Spring Data JPA, Hibernate |
| Cơ sở dữ liệu | Microsoft SQL Server |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |

## Yêu cầu môi trường

- **Backend:** JDK 17+, Maven 3.9+ (hoặc dùng Maven Wrapper có sẵn trong `backend/`)
- **CSDL:** SQL Server (ví dụ cổng mặc định `1433`)
- **Frontend:** Node.js 20+ (khuyến nghị LTS) và npm

## Cấu trúc thư mục

```
Manage-students/
├── backend/     # Spring Boot API
└── frontend/    # Next.js UI
```

---

## Hướng dẫn cài đặt — Backend

### 1. Chuẩn bị SQL Server

1. Cài và khởi chạy SQL Server.
2. Tạo cơ sở dữ liệu (tên mặc định trong cấu hình mẫu: `STManager`), hoặc đổi `databaseName` trong `application.yml` cho khớp với DB bạn đã tạo.
3. Tạo tài khoản đăng nhập SQL (ví dụ `sa` hoặc user riêng) và cấp quyền truy cập DB đó.

### 2. Cấu hình kết nối

Sửa file `backend/src/main/resources/application.yml` cho phù hợp môi trường của bạn, tối thiểu:

- `spring.datasource.url` — host, cổng, tên database
- `spring.datasource.username` / `password`
- `app.jwt.secret` — **bắt buộc đổi** khi triển khai thật (chuỗi bí mật đủ dài, an toàn)

Schema bảng có thể được Hibernate tạo/cập nhật theo `spring.jpa.hibernate.ddl-auto` (mặc định `update`). Trên môi trường production nên dùng migration có kiểm soát thay vì `update` tùy ý.

### 3. Chạy API

Từ thư mục `backend`:

```bash
cd backend
./mvnw spring-boot:run
```

Trên Windows (PowerShell hoặc CMD):

```bash
cd backend
mvnw.cmd spring-boot:run
```

Nếu đã cài Maven toàn cục:

```bash
cd backend
mvn spring-boot:run
```

API mặc định lắng nghe tại **http://localhost:8080**. Context path gốc `/`; các endpoint REST thường có tiền tố `/api/v1/...`.

### 4. Build JAR (tùy chọn)

```bash
cd backend
./mvnw -DskipTests package
java -jar target/manage-students-1.0.0-SNAPSHOT.jar
```

---

## Hướng dẫn cài đặt — Frontend

### 1. Biến môi trường

Trong `frontend/` có file mẫu `.env.example`. Tạo file `.env.local` (hoặc `.env`) và sao chép nội dung cần thiết:

```bash
cd frontend
cp .env.example .env.local
```

Chỉnh `NEXT_PUBLIC_API_BASE_URL` trỏ tới URL backend (mặc định `http://localhost:8080` nếu không đặt).

### 2. Cài dependency và chạy dev

```bash
cd frontend
npm install
npm run dev
```

Mở trình duyệt tại **http://localhost:3000**.

### 3. Build production (tùy chọn)

```bash
cd frontend
npm run build
npm start
```

---

## Chạy full stack nhanh

1. Khởi động SQL Server và đảm bảo cấu hình trong `application.yml` đúng.
2. Terminal 1: `cd backend && ./mvnw spring-boot:run`
3. Terminal 2: `cd frontend && npm install && npm run dev`
4. Truy cập UI: http://localhost:3000 — gọi API: http://localhost:8080

---

## Lưu ý bảo mật

- Không commit mật khẩu DB, JWT secret, hay file `.env.local` chứa bí mật lên kho mã nguồn công khai.
- Trên server thật, dùng biến môi trường hoặc secret manager để inject `spring.datasource.*` và `app.jwt.secret`.
