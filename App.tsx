import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Contact } from './types';
import { dbService } from './services/dbService';
import { geminiService } from './services/geminiService';
import { UserPlus, Trash2, Database, Sparkles, Search, Phone } from './components/Icons';

function App() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  // 初始化 (InitList)
  useEffect(() => {
    const loaded = dbService.loadContacts();
    setContacts(loaded);
  }, []);

  // 保存变更
  useEffect(() => {
    dbService.saveContacts(contacts);
  }, [contacts]);

  // 显示通知
  const showNotify = (msg: string, type: 'success' | 'error') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // 3. 头插法插入算法 (CreateListF 逻辑)
  // 原理：新结点指向首结点，头结点指向新结点 -> React 中即 [新, ...旧]
  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) {
      showNotify("姓名和电话不能为空", 'error');
      return;
    }

    if (newName.length > 20) {
      showNotify("姓名过长 (最多20字符)", 'error');
      return;
    }
    if (newPhone.length > 15) {
      showNotify("电话过长 (最多15字符)", 'error');
      return;
    }

    const newContact: Contact = {
      id: uuidv4(),
      name: newName.trim(),
      phone: newPhone.trim(),
      createdAt: Date.now()
    };

    // 头插法：最新的在最前
    setContacts(prev => [newContact, ...prev]);
    setNewName('');
    setNewPhone('');
    showNotify("联系人添加成功", 'success');
  };

  const handleDelete = (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
    showNotify("联系人已删除", 'success');
  };

  const handleSQLDownload = () => {
    dbService.downloadSQL(contacts);
    showNotify("SQL 备份文件已下载", 'success');
  };

  const handleAiParse = async () => {
    if (!aiInput.trim()) return;
    setIsAiLoading(true);
    
    const result = await geminiService.parseContactInfo(aiInput);
    
    setIsAiLoading(false);
    
    if (result) {
      setNewName(result.name);
      setNewPhone(result.phone);
      setAiInput('');
      showNotify("AI 已成功提取联系人信息！", 'success');
    } else {
      showNotify("未能提取有效的联系人信息。", 'error');
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* 导航栏 */}
      <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                N
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Nexus <span className="text-indigo-600">通讯录</span></h1>
            </div>
            <button 
              onClick={handleSQLDownload}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
              title="导出为 SQL 文件"
            >
              <Database />
              <span className="hidden sm:inline">导出 SQL</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* 通知提示 */}
        {notification && (
          <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white transform transition-all duration-300 z-50 ${notification.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
            {notification.msg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* 左侧：表单区域 */}
          <div className="md:col-span-5 space-y-6">
            
            {/* AI 智能添加 */}
            <div className="bg-white rounded-xl shadow-sm border border-indigo-100 overflow-hidden">
              <div className="p-4 bg-indigo-50 border-b border-indigo-100 flex items-center gap-2">
                <Sparkles className="text-indigo-600" />
                <h2 className="font-semibold text-indigo-900">AI 快速添加</h2>
              </div>
              <div className="p-4 space-y-3">
                <p className="text-xs text-indigo-600 mb-2">
                  粘贴文本（如："请联系张三 18971447533"），让 AI 自动识别填写。
                </p>
                <textarea 
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="在此粘贴包含姓名和电话的文本..."
                  className="w-full px-3 py-2 text-sm border border-indigo-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none h-20 bg-white text-slate-900"
                />
                <button
                  onClick={handleAiParse}
                  disabled={isAiLoading || !aiInput}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAiLoading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <Sparkles /> 智能解析
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 手动录入表单 */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h2 className="font-semibold text-slate-800">新建联系人</h2>
              </div>
              <form onSubmit={handleAddContact} className="p-4 space-y-4">
                <div>
                  <label htmlFor="name" className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">姓名 (最大 20 字符)</label>
                  <input
                    id="name"
                    type="text"
                    maxLength={20}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="例如：张三"
                    className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">电话 (最大 15 字符)</label>
                  <input
                    id="phone"
                    type="text"
                    maxLength={15}
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="例如：18971447533"
                    className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-md transition-colors flex justify-center items-center gap-2 shadow-lg shadow-slate-900/10"
                >
                  <UserPlus /> 添加联系人
                </button>
              </form>
            </div>
          </div>

          {/* 右侧：列表区域 (DispList) */}
          <div className="md:col-span-7 space-y-4">
            {/* 搜索框 */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search />
              </div>
              <input 
                type="text" 
                placeholder="搜索联系人..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white text-slate-900 border border-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
            </div>

            {/* 列表 */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-semibold text-slate-800">联系人列表</h3>
                <span className="text-xs font-medium px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">
                  {contacts.length} 条记录
                </span>
              </div>
              
              {contacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                  <div className="p-4 bg-slate-50 rounded-full mb-3">
                    <UserPlus />
                  </div>
                  <p>暂无联系人</p>
                  <p className="text-sm">请在左侧添加。</p>
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  未找到匹配的联系人。
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {filteredContacts.map((contact) => (
                    <li key={contact.id} className="group flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors duration-150">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {contact.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Phone className="text-slate-400 w-3 h-3" />
                          <p className="text-sm text-slate-500 truncate font-mono">
                            {contact.phone}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(contact.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all duration-200"
                        title="删除"
                      >
                        <Trash2 />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <p className="text-center text-xs text-slate-400 mt-4">
              模拟链表结构 · 头插法逻辑 (Head Insertion)
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;