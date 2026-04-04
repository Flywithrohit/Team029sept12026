import sqlite3

try:
    conn = sqlite3.connect('../instance/crm.db')
    cur = conn.cursor()
    cur.execute("UPDATE user SET role='Business Development Team' WHERE role='Business Development'")
    print(f'Updated {cur.rowcount} users')
    conn.commit()
    conn.close()
except Exception as e:
    print(e)
