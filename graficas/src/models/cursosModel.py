import mysql.connector
from mysql.connector import OperationalError

def obtener_conexion():
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="MillY0619*",
            database="cursosDB",
            port=3306
        )
        return conn
    except OperationalError:
        print("Intentando reconectar...")
        # Lógica de reconexión
        return obtener_conexion()
    
def obtener_notas_estudiante(correo):
    conn = obtener_conexion()    
    cursor = conn.cursor(dictionary=True)
    query = "SELECT nombreCurso, nota, periodo FROM cursos WHERE correoEstudiante = %s"
    cursor.execute(query, (correo,))
    resultados = cursor.fetchall()
    cursor.close()
    conn.close()
    return resultados

def obtener_rendimiento_estudiantes(correoProf):
    conn = obtener_conexion() 
    cursor = conn.cursor(dictionary=True)
    query = "SELECT nombreCurso, nota FROM cursos WHERE correoProfesor = %s"
    cursor.execute(query, (correoProf,))
    resultados = cursor.fetchall()
    cursor.close()
    conn.close()
    return resultados

def obtener_notas_estudiantes():
    conn = obtener_conexion() 
    cursor = conn.cursor(dictionary=True)
    query = "SELECT correoEstudiante, nombreCurso, nota FROM cursos"
    cursor.execute(query)
    resultados = cursor.fetchall()
    cursor.close()
    conn.close()
    return resultados
