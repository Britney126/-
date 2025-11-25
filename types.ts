// Equivalent to struct ds in the C code
export interface Contact {
  id: string; // Unique identifier (simulating memory address)
  name: string; // char name[21]
  phone: string; // char phone[16]
  createdAt: number;
}

export interface SQLDumpOptions {
  tableName: string;
}
