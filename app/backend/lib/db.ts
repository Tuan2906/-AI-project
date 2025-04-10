import { Pool, QueryResult, QueryResultRow } from "pg";

// Định nghĩa type cho config của Pool
interface PoolConfig {
  connectionString?: string;
  ssl?: boolean | { rejectUnauthorized: boolean };
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

// Tạo pool kết nối PostgreSQL
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
} as PoolConfig);

// Xử lý lỗi pool
pool.on('error', (err: Error, client: any) => {
  console.error('Lỗi không mong muốn trong pool:', err);
  process.exit(-1);
});

// Định nghĩa type cho tham số truy vấn
type QueryParams = (string | number | boolean | null)[];

// Hàm truy vấn với typing, thêm constraint cho T
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: QueryParams
): Promise<QueryResult<T>> {
  try {
    const result = await pool.query<T>(text, params);
    return result;
  } catch (error) {
    console.error('Lỗi khi thực thi truy vấn:', error);
    throw error;
  }
}

// Hàm kiểm tra kết nối
let isConnected = false;
export async function checkDatabaseConnection() {
  if (isConnected) {
    console.log('Đã kết nối PostgreSQL trước đó, bỏ qua kiểm tra.');
    return;
  }

  try {
    const client = await pool.connect();
    console.log('Kết nối PostgreSQL thành công!');
    client.release();
    isConnected = true;
  } catch (error) {
    console.error('Lỗi khi kết nối PostgreSQL:', error);
    throw error;
  }
}

// Export pool để sử dụng trực tiếp nếu cần
export { pool };