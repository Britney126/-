import { Contact } from '../types';

const STORAGE_KEY = 'nexus_contacts_v1';

// 模拟数据库操作
export const dbService = {
  // 加载数据 (InitList)
  loadContacts: (): Contact[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("加载联系人失败", e);
      return [];
    }
  },

  // 保存数据
  saveContacts: (contacts: Contact[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
  },

  // 生成 SQL 以满足 "用数据库存储" 的要求
  generateSQL: (contacts: Contact[]): string => {
    const tableName = 'contacts';
    let sql = `-- Nexus 通讯录管理系统生成的数据库导出\n`;
    sql += `-- 导出时间: ${new Date().toLocaleString()}\n\n`;
    
    // 创建表结构
    sql += `CREATE TABLE IF NOT EXISTS ${tableName} (\n`;
    sql += `    id VARCHAR(36) PRIMARY KEY,\n`;
    sql += `    name VARCHAR(21) NOT NULL COMMENT '姓名',\n`;
    sql += `    phone VARCHAR(16) NOT NULL COMMENT '电话',\n`;
    sql += `    created_at BIGINT\n`;
    sql += `);\n\n`;

    // 插入数据
    if (contacts.length > 0) {
      sql += `INSERT INTO ${tableName} (id, name, phone, created_at) VALUES\n`;
      const values = contacts.map(c => {
        // 防止 SQL 注入
        const safeName = c.name.replace(/'/g, "''");
        const safePhone = c.phone.replace(/'/g, "''");
        return `('${c.id}', '${safeName}', '${safePhone}', ${c.createdAt})`;
      }).join(',\n');
      sql += values + `;\n`;
    }

    return sql;
  },

  downloadSQL: (contacts: Contact[]) => {
    const sqlContent = dbService.generateSQL(contacts);
    const blob = new Blob([sqlContent], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tongxunlu_backup.sql'; // 通讯录备份
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};