-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "short_name" TEXT,
    "phone" TEXT,
    "external_auth_id" TEXT,
    "external_auth_issue" TEXT,
    "pic_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "permissions" TEXT[],
    "last_activity_date" TIMESTAMP(3),
    "updated_on" TIMESTAMP(3),
    "created_on" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" TEXT,
    "updated_by_id" TEXT,
    "settings" JSONB,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NhanVien" (
    "id" TEXT NOT NULL,
    "hoTen" TEXT NOT NULL,
    "ngaySinh" TIMESTAMP(3),
    "diaChi" TEXT,
    "soDienThoai" TEXT,
    "email" TEXT,
    "chucVu" TEXT,
    "phongBan" TEXT,
    "ngayVaoLam" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedOn" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "NhanVien_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BaiThi" (
    "id" TEXT NOT NULL,
    "nhanVienId" TEXT NOT NULL,
    "diem" DOUBLE PRECISION NOT NULL,
    "ngayVaoThi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "soCauDung" INTEGER NOT NULL,
    "createdOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedOn" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,
    "cauHoi" JSONB NOT NULL,

    CONSTRAINT "BaiThi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "NhanVien_email_key" ON "NhanVien"("email");
