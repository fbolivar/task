import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ReportStats } from '../types';

export const generateExecutivePDF = (
    stats: ReportStats,
    projectName: string,
    startDate: string,
    endDate: string
) => {
    const doc = new jsPDF();
    const primaryColor: [number, number, number] = [37, 99, 235]; // Tailwind blue-600
    const secondaryColor: [number, number, number] = [71, 85, 105]; // Slate-600

    // Header with Design
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 50, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORME EJECUTIVO DE GESTIÓN', 15, 25);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const rangeText = `PERIODO DE ANÁLISIS: ${startDate || 'HISTÓRICO'} AL ${endDate || 'ACTUAL'}`;
    doc.text(rangeText, 15, 35);
    doc.text(`PROYECTO: ${projectName.toUpperCase()}`, 15, 42);

    // Executive Summary
    let y = 65;
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
