import mysql.connector
from mysql.connector import OperationalError

def obtener_conexion():
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="MillY0619*",
            database="usuariosDB",
            port=3306
        )
        return conn
    except OperationalError:
        print("Intentando reconectar...")
        # Lógica de reconexión
        return obtener_conexion()
    
def obtener_correo_profesor(usuario):
    conn = obtener_conexion() 
    cursor = conn.cursor(dictionary=True)
    query = "SELECT correo FROM profesores WHERE usuario = %s"
    cursor.execute(query, (usuario,))
    resultados = cursor.fetchall()
    cursor.close()
    conn.close()
    return resultados
