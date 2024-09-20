const express = require('express');
const router = express.Router();
const cursosModel = require('../models/cursosModel');
const axios = require('axios');

// Obtener cursos que un estudiante ha cursado en el pasado
// Obtener cursos que un estudiante ha cursado en el pasado
router.get('/cursos/estudiante/:nombreEstudiante/pasados', async (req, res) => {
    const { nombreEstudiante } = req.params;

    try {
        // Verificar si el estudiante existe
        const responseEstudiante = await axios.get(`http://localhost:3005/estudiantes/${nombreEstudiante}`);
        if (responseEstudiante.status !== 200) {
            return res.status(404).json({ error: 'Estudiante no encontrado' });
        }

        // Obtener cursos pasados
        const cursos = await cursosModel.obtenerCursosPorEstudianteNoPeriodo(nombreEstudiante, '2024-3');

        if (!cursos || cursos.length === 0) {
            return res.status(404).json({ message: 'No se encontraron cursos pasados para este estudiante.' });
        }

        res.json(cursos);
    } catch (error) {
        console.error('Error al obtener los cursos:', error);
        res.status(500).json({ error: `Error al obtener los cursos: ${error.message}` });
    }
});

// Obtener cursos que un estudiante está cursando actualmente
router.get('/cursos/estudiante/:nombreEstudiante/actual', async (req, res) => {
    const { nombreEstudiante } = req.params;

    try {
        const responseEstudiante = await axios.get(`http://localhost:3005/estudiantes/${nombreEstudiante}`);
        if (responseEstudiante.status !== 200) {
            return res.status(404).json({ error: 'Estudiante no encontrado' });
        }

        const cursos = await cursosModel.obtenerCursosPorEstudianteYPeriodo(nombreEstudiante, '2024-3');
        res.json(cursos);
    } catch (error) {
        console.error('Error al obtener los cursos actuales:', error);
        res.status(500).json({ error: `Error al obtener los cursos actuales del estudiante: ${error.message}` });
    }
});

module.exports = router;


// Obtener cursos que un estudiante está cursando actualmente
router.get('/cursos/estudiante/:nombreEstudiante/actual', async (req, res) => {
    const { nombreEstudiante } = req.params;
    try {
        const responseEstudiante = await axios.get(`http://localhost:3005/estudiantes/${nombreEstudiante}`);
        if (responseEstudiante.status !== 200) {
            return res.status(404).json({ error: 'Estudiante no encontrado' });
        }

        const cursos = await cursosModel.obtenerCursosPorEstudianteYPeriodo(nombreEstudiante, '2024-3');
        res.json(cursos);
    } catch (error) {
        res.status(500).json({ error: `Error al obtener los cursos actuales del estudiante: ${error.message}` });
    }
});

// Obtener cursos de un profesor en un periodo específico
router.get('/cursos/profesor/:correoProfesor', async (req, res) => {
    const { correoProfesor } = req.params;
    const periodo = '2024-3'; // Define el periodo fijo aquí
    try {
        const cursos = await cursosModel.obtenerCursosPorProfesorYPeriodo(correoProfesor, periodo);
        res.json(cursos);
    } catch (error) {
        res.status(500).json({ error: `Error al obtener los cursos del profesor: ${error.message}` });
    }
});


// Obtener todos los cursos sin ningún filtro
router.get('/cursos', async (req, res) => {
    try {
        const cursos = await cursosModel.obtenerTodosLosCursos();
        res.json(cursos);
    } catch (error) {
        res.status(500).json({ error: `Error al obtener todos los cursos: ${error.message}` });
    }
});

// Obtener detalles de un curso por nombreCurso y grupo
router.get('/cursos/:nombreCurso/:grupo', async (req, res) => {
    const { nombreCurso, grupo } = req.params;

    try {
        const curso = await cursosModel.traerCursoPorNombreYGrupo(nombreCurso, grupo);

        if (!curso) {
            return res.status(404).json({ error: 'Curso no encontrado' });
        }

        res.json({
            nombreCurso: curso.nombreCurso,  // Usar nombreCurso del objeto curso
            grupo: curso.grupo,
        });
    } catch (error) {
        res.status(500).json({ error: `Error al obtener el curso: ${error.message}` });
    }
});



// Obtener asignaturas no cursadas o con nota baja para un estudiante
router.get('/cursos/asignaturas/no-cursadas-o-nota-baja/:nombreEstudiante', async (req, res) => {
    const { nombreEstudiante } = req.params;

    try {
        const asignaturas = await cursosModel.obtenerAsignaturasNoCursadasONotaBaja(nombreEstudiante);

        // Usar un Set para filtrar los nombres duplicados
        const nombresUnicos = [...new Set(asignaturas.map(asig => asig.nombreCurso))];

        // Mapear a un nuevo formato
        const resultado = nombresUnicos.map(nombre => ({ nombreCurso: nombre }));

        res.json(resultado);
    } catch (error) {
        res.status(500).json({ error: `Error al obtener asignaturas no cursadas o con nota baja: ${error.message}` });
    }
});


// Matricular un estudiante en un curso
router.post('/cursos/matricular', async (req, res) => {
    const { usuarioEstudiante, nombreAsignatura } = req.body;

    if (!usuarioEstudiante || !nombreAsignatura) {
        return res.status(400).json({ error: 'Faltan datos en la solicitud' });
    }

    try {
        const responseAsignatura = await axios.get(`http://localhost:3006/asignaturas/nombre/${nombreAsignatura}`);
        const { nombreAsignatura: nombre, cupos, creditos } = responseAsignatura.data;

        const responseEstudiante = await axios.get(`http://localhost:3005/estudiantes/${usuarioEstudiante}`);
        const { nombre: nombreEstudiante, correo: correoEstudiante, totalCreditos } = responseEstudiante.data;

        if (totalCreditos + creditos > 18) {
            return res.status(400).json({ error: 'El estudiante supera el límite de 18 créditos' });
        }

        if (cupos <= 0) {
            return res.status(400).json({ error: 'No hay cupos disponibles' });
        }

        const grupo = await cursosModel.obtenerNuevoGrupo('2024-3'); 
        const cursoExistente = await cursosModel.traerCursoPorNombreYGrupo(nombre, grupo);

        let profesor;
        if (cursoExistente) {
            profesor = {
                nombre: cursoExistente.profesor,
                correo: cursoExistente.correoProfesor
            };
        } else {
            const responseProfesores = await axios.get('http://localhost:3005/profesores');
            const profesores = responseProfesores.data;
            profesor = profesores[Math.floor(Math.random() * profesores.length)];
        }

        const nuevoCurso = {
            nombreCurso: nombre,
            grupo: grupo,
            profesor: profesor.nombre,
            correoProfesor: profesor.correo,
            nombreEstudiante: nombreEstudiante,
            correoEstudiante: correoEstudiante,
            nota: null,
            periodo: '2024-3'
        };

        await cursosModel.crearCurso(nuevoCurso);
        await axios.put(`http://localhost:3006/asignaturas/${responseAsignatura.data.id}/cupos`, { cupos: cupos - 1 });
        await axios.put(`http://localhost:3005/estudiantes/${usuarioEstudiante}/creditos`, { totalCreditos: totalCreditos + creditos });

        res.status(201).json({ message: 'Estudiante matriculado exitosamente' });
    } catch (error) {
        console.error('Error en la matriculación:', error); // Log del error
        res.status(500).json({ error: `Error al matricular estudiante: ${error.message}` });
    }
});

router.put('/cursos/actualizarNota', async (req, res) => {
    const { nombreEstudiante, grupo, nombreCurso, nota } = req.body;

    // Log de los datos recibidos
    console.log({
        nombreEstudiante,
        grupo,
        nombreCurso,
        nota
    });

    if (!nombreEstudiante || !grupo || !nombreCurso || nota === undefined) {
        return res.status(400).json({ error: 'Faltan datos en la solicitud' });
    }

    try {
        const result = await cursosModel.actualizarNotaPorNombre(nombreEstudiante, grupo, nombreCurso, nota);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Curso no encontrado o el estudiante no está matriculado' });
        }

        res.status(200).json({ message: 'Nota actualizada exitosamente' });
    } catch (error) {
        res.status(500).json({ error: `Error al actualizar la nota: ${error.message}` });
    }
});

module.exports = router;