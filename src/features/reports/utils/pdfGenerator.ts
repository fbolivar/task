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
    const primaryColor: [number, number, number] = [47, 133, 90]; // PNN Green (approx #2F855A)
    const secondaryColor: [number, number, number] = [26, 32, 44]; // Slate-900

    // Header with Design
    const headerHeight = 60;
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, headerHeight, 'F');

    // Decorative line
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.5);
    doc.line(15, headerHeight - 10, 195, headerHeight - 10);

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
            const boxX = 145;
            const boxY = 15;

            // Add white background container adjusted
            doc.setFillColor(255, 255, 255);
            doc.roundedRect(boxX - 5, boxY - 5, maxWidth + 10, maxHeight + 10, 2, 2, 'F');

            // Center in box
            const x = boxX + (maxWidth - w) / 2;
            const y = boxY + (maxHeight - h) / 2;

            const format = entityLogoUrl.toLowerCase().endsWith('.png') ? 'PNG' : 'JPEG';
            doc.addImage(img, format, x, y, w, h);
        } catch (e) {
            console.error('Error adding logo to PDF:', e);
        }
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');

    // Dynamic text positioning
    const title = 'INFORME EJECUTIVO DE GESTIÓN';
    doc.text(title, 15, 25);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('SISTEMA DE GESTIÓN INTEGRAL', 15, 32);

    const rangeText = `PERIODO DE ANÁLISIS: ${startDate || 'HISTÓRICO'} AL ${endDate || 'ACTUAL'}`;
    doc.text(rangeText, 15, 42);
    doc.text(`PROYECTO: ${projectName.toUpperCase()}`, 15, 47, { maxWidth: 120 });

    // Executive Summary
    let y = headerHeight + 20;
    doc.setTextColor(47, 133, 90); // Primary Text
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('1. RESUMEN EJECUTIVO', 15, y);

    // Underline
    doc.setDrawColor(200, 200, 200);
    doc.line(15, y + 2, 195, y + 2);
    y += 10;

    autoTable(doc, {
        startY: y,
        head: [['INDICADOR CLAVE', 'VALOR']],
        body: [
            ['Total de Tareas Gestionadas', stats.total_tasks.toString()],
            ['Tareas Completadas', stats.completed_tasks.toString()],
            // Removed 'Avance Promedio del Portafolio' as requested
            ['Tareas Pendientes / En Proceso', stats.pending_tasks.toString()]
        ],
        theme: 'grid',
        headStyles: {
            fillColor: primaryColor,
            fontSize: 10,
            fontStyle: 'bold',
            halign: 'center'
        },
        bodyStyles: {
            fontSize: 10,
            cellPadding: 6
        },
        columnStyles: {
            0: { fontStyle: 'bold' },
            1: { halign: 'center' }
        }
    });

    y = (doc as any).lastAutoTable.finalY + 20;

    // Status Breakdown
    doc.setTextColor(47, 133, 90);
    doc.setFontSize(14);
    doc.text('2. DESGLOSE POR ESTADOS', 15, y);
    doc.line(15, y + 2, 195, y + 2);
    y += 10;

    const statusRows = Object.entries(stats.tasks_by_status).map(([status, count]) => [
        status,
        count.toString(),
        `${Math.round((count / stats.total_tasks) * 100)}%`
    ]);

    autoTable(doc, {
        startY: y,
        head: [['ESTADO', 'CANTIDAD', 'PORCENTAJE']],
        body: statusRows,
        theme: 'striped',
        headStyles: { fillColor: secondaryColor },
        styles: { fontSize: 9, cellPadding: 4 },
        columnStyles: {
            1: { halign: 'center' },
            2: { halign: 'center' }
        }
    });

    y = (doc as any).lastAutoTable.finalY + 20;

    // Team Efficacy
    if (y > 230) { doc.addPage(); y = 20; }

    doc.setTextColor(47, 133, 90);
    doc.setFontSize(14);
    doc.text('3. INDICADORES DE EFICACIA', 15, y);
    doc.line(15, y + 2, 195, y + 2);
    y += 10;

    autoTable(doc, {
        startY: y,
        head: [['COLABORADOR', 'EFICACIA', 'PUNTUAL.', 'H. EST.', 'H. REAL', 'EFICIENCIA', 'CARGA']],
        body: stats.team_efficacy.map(m => [
            m.full_name,
            `${m.efficacy}%`,
            `${m.punctuality}%`,
            m.estHours.toString(),
            m.actHours.toString(),
            `${m.efficiency}%`,
            m.load.toString()
        ]),
        headStyles: { fillColor: secondaryColor },
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: {
            1: { halign: 'center' },
            2: { halign: 'center' },
            3: { halign: 'center' },
            4: { halign: 'center' },
            5: { halign: 'center' },
            6: { halign: 'center' }
        }
    });

    y = (doc as any).lastAutoTable.finalY + 20;

    // 4. Projects Status
    if (stats.projects_list && stats.projects_list.length > 0) {
        if (y > 230) { doc.addPage(); y = 20; }
        doc.setTextColor(47, 133, 90);
        doc.setFontSize(14);
        doc.text('4. ESTADO DE PROYECTOS', 15, y);
        doc.line(15, y + 2, 195, y + 2);
        y += 10;

        autoTable(doc, {
            startY: y,
            head: [['PROYECTO', 'ESTADO', 'AVANCE', 'RIESGO', 'PRESUPUESTO']],
            body: stats.projects_list.map(p => [
                p.name,
                p.status,
                `${p.progress}%`,
                p.risk_level,
                `$ ${p.budget.toLocaleString()}`
            ]),
            headStyles: { fillColor: primaryColor },
            styles: { fontSize: 8 },
            columnStyles: {
                2: { halign: 'center' },
                4: { halign: 'right' }
            }
        });
        y = (doc as any).lastAutoTable.finalY + 10;
    }

    // 5. Hiring Processes
    if (stats.hiring_processes && stats.hiring_processes.length > 0) {
        if (y > 230) { doc.addPage(); y = 20; }
        y += 5;
        doc.setTextColor(47, 133, 90);
        doc.setFontSize(14);
        doc.text('5. PROCESOS DE CONTRATACIÓN', 15, y);
        doc.line(15, y + 2, 195, y + 2);
        y += 10;

        autoTable(doc, {
            startY: y,
            head: [['PROCESO', 'ESTADO', 'AVANCE', 'RESPONSABLE']],
            body: stats.hiring_processes.map(h => [
                h.title,
                h.status,
                `${h.total_progress}%`,
                h.assigned_to_name
            ]),
            headStyles: { fillColor: secondaryColor },
            styles: { fontSize: 8 }
        });
        y = (doc as any).lastAutoTable.finalY + 10;
    }

    // 6. Detailed Tasks List (Top 50)
    if (stats.tasks_list && stats.tasks_list.length > 0) {
        doc.addPage();
        y = 20;
        doc.setTextColor(47, 133, 90);
        doc.setFontSize(14);
        doc.text('6. DETALLE OPERATIVO (Top 50)', 15, y);
        doc.line(15, y + 2, 195, y + 2);
        y += 10;

        autoTable(doc, {
            startY: y,
            head: [['TAREA', 'ESTADO', 'PRIORIDAD', 'VENCE', 'RESPONSABLE']],
            body: stats.tasks_list.map(t => [
                t.title,
                t.status,
                t.priority,
                t.end_date ? new Date(t.end_date).toLocaleDateString() : 'Sin Fecha',
                t.assigned_to_name
            ]),
            headStyles: { fillColor: primaryColor },
            styles: { fontSize: 8 },
            columnStyles: {
                2: { halign: 'center' }
            }
        });
    }

    // 7. Bitácora de Seguimiento
    if (stats.followups && stats.followups.length > 0) {
        doc.addPage();
        y = 20;
        doc.setTextColor(47, 133, 90);
        doc.setFontSize(14);
        doc.text('7. BITÁCORA DE SEGUIMIENTO', 15, y);
        doc.line(15, y + 2, 195, y + 2);
        y += 10;

        autoTable(doc, {
            startY: y,
            head: [['FECHA', 'TAREA', 'RESPONSABLE', 'AVANCE', 'OBSERVACIONES']],
            body: stats.followups.map(f => [
                new Date(f.report_date).toLocaleDateString(),
                f.task_title,
                f.user_name,
                f.progress,
                f.issues || '-'
            ]),
            headStyles: { fillColor: secondaryColor },
            styles: { fontSize: 8, cellPadding: 3 },
            columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 40 },
                2: { cellWidth: 30 },
                3: { cellWidth: 'auto' },
                4: { cellWidth: 40 }
            }
        });
    }

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(
            `Generado el ${new Date().toLocaleString()} • Página ${i} de ${pageCount}`,
            105,
            285,
            { align: 'center' }
        );
        doc.text(
            'Sistema de Gestión - Parques Nacionales Naturales de Colombia',
            105,
            290,
            { align: 'center' }
        );
    }

    doc.save(`Reporte_Gestion_${projectName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
};
