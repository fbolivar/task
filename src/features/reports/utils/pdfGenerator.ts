import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ReportStats } from '../types';

export const generateExecutivePDF = async (
    stats: ReportStats,
    projectName: string,
    startDate: string,
    endDate: string,
    entityLogoUrl?: string | null
) => {
    const doc = new jsPDF();
    const primaryColor: [number, number, number] = [37, 99, 235]; // Tailwind blue-600
    const secondaryColor: [number, number, number] = [71, 85, 105]; // Slate-600

    // Header with Design
    const headerHeight = 60;
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, headerHeight, 'F');

    // Add Logo if available
    if (entityLogoUrl) {
        try {
            // Load image to get dimensions
            const img = new Image();
            img.src = entityLogoUrl;
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });

            // Calculate functionality to fit in box 50x25
            const maxWidth = 50;
            const maxHeight = 25;
            const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
            const w = img.width * ratio;
            const h = img.height * ratio;

            // Position (Right aligned in the box at 155, 10)
            const boxX = 155;
            const boxY = 10;

            // Center in box
            const x = boxX + (maxWidth - w) / 2;
            const y = boxY + (maxHeight - h) / 2;

            // Add white background container adjusted to image size (optional, or kept fixed)
            doc.setFillColor(255, 255, 255);
            doc.roundedRect(boxX, boxY, maxWidth, maxHeight, 3, 3, 'F');

            const format = entityLogoUrl.toLowerCase().endsWith('.png') ? 'PNG' : 'JPEG';
            doc.addImage(img, format, x, y, w, h);
        } catch (e) {
            console.error('Error adding logo to PDF:', e);
        }
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');

    // Dynamic text positioning
    const title = 'INFORME EJECUTIVO DE GESTIÓN';
    const titleLines = doc.splitTextToSize(title, 135);
    doc.text(titleLines, 15, 25);

    // Calculate offset based on title lines (approx 10 units per line for size 24)
    const titleOffset = (titleLines.length * 10);
    const nextY = 25 + titleOffset - 5; // Adjust slightly up to reduce gap

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const rangeText = `PERIODO DE ANÁLISIS: ${startDate || 'HISTÓRICO'} AL ${endDate || 'ACTUAL'}`;
    doc.text(rangeText, 15, nextY, { maxWidth: 135 });
    doc.text(`PROYECTO: ${projectName.toUpperCase()}`, 15, nextY + 7, { maxWidth: 190 });

    // Executive Summary
    let y = headerHeight + 15;
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(16);
    doc.text('1. Resumen Ejecutivo', 15, y);
    y += 10;

    autoTable(doc, {
        startY: y,
        head: [['Métrica de Desempeño', 'Valor']],
        body: [
            ['Total de Tareas Gestionadas', stats.total_tasks.toString()],
            ['KPI de Cumplimiento (Completadas)', stats.completed_tasks.toString()],
            ['Avance Promedio del Portafolio', `${stats.avg_progress}%`],
            ['Tareas en Cola / Pendientes', stats.pending_tasks.toString()]
        ],
        theme: 'striped',
        headStyles: { fillColor: primaryColor },
        styles: { fontSize: 11, cellPadding: 5 }
    });

    y = (doc as any).lastAutoTable.finalY + 20;

    // Status Breakdown
    doc.setFontSize(16);
    doc.text('2. Desglose Operativo por Estados', 15, y);
    y += 5;

    const statusRows = Object.entries(stats.tasks_by_status).map(([status, count]) => [
        status,
        count.toString(),
        `${Math.round((count / stats.total_tasks) * 100)}%`
    ]);

    autoTable(doc, {
        startY: y,
        head: [['Estado', 'Cantidad', 'Porcentaje']],
        body: statusRows,
        theme: 'grid',
        headStyles: { fillColor: secondaryColor },
        styles: { fontSize: 10 }
    });

    y = (doc as any).lastAutoTable.finalY + 20;

    // Team Efficacy
    if (y > 230) { doc.addPage(); y = 20; }

    doc.setFontSize(16);
    doc.text('3. Indicadores de Eficacia por Colaborador', 15, y);
    y += 5;

    autoTable(doc, {
        startY: y,
        head: [['Colaborador', 'Eficacia', 'Puntualidad', 'Eficiencia', 'Carga']],
        body: stats.team_efficacy.map(m => [
            m.full_name,
            `${m.efficacy}%`,
            `${m.punctuality}%`,
            `${m.efficiency}%`,
            m.load.toString()
        ]),
        headStyles: { fillColor: [79, 70, 229] }, // Indigo
        styles: { fontSize: 9 }
    });

    y = (doc as any).lastAutoTable.finalY + 20;

    // 4. Projects Status
    if (stats.projects_list && stats.projects_list.length > 0) {
        if (y > 230) { doc.addPage(); y = 20; }
        y += 10;
        doc.setFontSize(16);
        doc.text('4. Estado de Proyectos', 15, y);
        y += 5;

        autoTable(doc, {
            startY: y,
            head: [['Proyecto', 'Estado', 'Riesgo', 'Presupuesto']],
            body: stats.projects_list.map(p => [
                p.name,
                p.status,
                p.risk_level,
                `$ ${p.budget.toLocaleString()}`
            ]),
            headStyles: { fillColor: [15, 118, 110] }, // Emerald-700
            styles: { fontSize: 9 }
        });
        y = (doc as any).lastAutoTable.finalY + 10;
    }

    // 5. Hiring Processes
    if (stats.hiring_processes && stats.hiring_processes.length > 0) {
        if (y > 230) { doc.addPage(); y = 20; }
        y += 10;
        doc.setFontSize(16);
        doc.text('5. Procesos de Contratación Activos', 15, y);
        y += 5;

        autoTable(doc, {
            startY: y,
            head: [['Proceso', 'Estado', 'Avance', 'Responsable']],
            body: stats.hiring_processes.map(h => [
                h.title,
                h.status,
                `${h.total_progress}%`,
                h.assigned_to_name
            ]),
            headStyles: { fillColor: [180, 83, 9] }, // Amber-700
            styles: { fontSize: 9 }
        });
        y = (doc as any).lastAutoTable.finalY + 10;
    }

    // 6. Detailed Tasks List (Top 50)
    if (stats.tasks_list && stats.tasks_list.length > 0) {
        if (y > 230) { doc.addPage(); y = 20; }
        doc.addPage(); // Force new page for detailed list usually
        y = 20;
        doc.setFontSize(16);
        doc.text('6. Seguimiento Detallado de Tareas (Top 50)', 15, y);
        y += 5;

        autoTable(doc, {
            startY: y,
            head: [['Tarea', 'Estado', 'Prioridad', 'Fecha Límite', 'Responsable']],
            body: stats.tasks_list.map(t => [
                t.title,
                t.status,
                t.priority,
                t.end_date ? new Date(t.end_date).toLocaleDateString() : 'Sin Fecha',
                t.assigned_to_name
            ]),
            headStyles: { fillColor: [67, 56, 202] }, // Indigo-700
            styles: { fontSize: 8 }
        });
    }

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
            `Generado automáticamente por SaaS Factory Intelligence - Página ${i} de ${pageCount}`,
            105,
            285,
            { align: 'center' }
        );
    }

    doc.save(`reporte-ejecutivo-${new Date().getTime()}.pdf`);
};
