import sqlite3
from typing import Dict, List, Any

# 简单的内存数据库，用于演示
class MemoryDB:
    def __init__(self):
        self.history = []
        
    def save_analysis(self, data: Dict[str, Any]) -> str:
        # 生成ID
        record_id = str(len(self.history) + 1)
        data['id'] = record_id
        self.history.append(data)
        return record_id
    
    def get_history(self) -> List[Dict[str, Any]]:
        return self.history
    
    def get_analysis(self, record_id: str) -> Dict[str, Any]:
        for record in self.history:
            if record['id'] == record_id:
                return record
        return None

# 全局数据库实例
db = MemoryDB()

def get_db():
    return db 