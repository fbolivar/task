import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FinancialRecord, FinancialSummary } from '../types';

export const generateFinancialReport = (
    records: FinancialRecord[],
    summary: FinancialSummary,
    entityName: string
) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const now = new Date().toLocaleDateString('es-CO');

    // --- Header ---
    doc.setFillColor(15, 23, 42); // Slate 900
    doc.rect(0, 0, pageWidth, 45, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('REPORTE DE RENTABILIDAD', 20, 25);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Entidad: ${entityName}`, 20, 35);
    doc.text(`Fecha de Emisión: ${now}`, pageWidth - 20, 25, { align: 'right' });

    // --- Summary Section ---
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('I. RESUMEN EJECUTIVO', 20, 60);

    autoTable(doc, {
        startY: 65,
        body: [
            ['Ingresos Totales', `$${summary.total_income.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`],
            ['Gastos Operativos', `$${summary.total_expenses.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`],
            ['Utilidad Neta', `$${summary.net_profit.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`],
            ['Margen de Rentabilidad', `${summary.profit_margin.toFixed(2)}%`],
            ['Ejecución Presupuestaria', summary.budget_execution > 0 ? `${summary.budget_execution.toFixed(2)}%` : 'Sin Planeación']
        ],
        theme: 'striped',
        styles: { fontSize: 11, cellPadding: 5 },
        columnStyles: {
            0: { fontStyle: 'bold' },
            1: { halign: 'right' }
        }
    });

    // --- Details Table ---
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('II. DETALLE DE MOVIMIENTOS', 20, finalY);

    autoTable(doc, {
        startY: finalY + 5,
        head: [['Fecha', 'Proyecto', 'Categoría', 'Tipo', 'Descripción', 'Monto']],
        body: records.map(r => [
            new Date(r.date).toLocaleDateString('es-CO'),
            r.project?.name || 'N/A',
            r.category,
            r.type,
            r.description || '-',
            {
                content: `${r.type === 'Ingreso' ? '+' : '-'}$${Number(r.amount).toLocaleString('es-CO')}`,
                styles: { textColor: r.type === 'Ingreso' ? [16, 185, 129] : [225, 29, 72], fontStyle: 'bold' }
            }
        ]),
        headStyles: { fillColor: [15, 23, 42] },
        styles: { fontSize: 8 },
        columnStyles: {
            5: { halign: 'right' }
        }
    });

    // --- Footer ---
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
        doc.text('BC FABRIC SAS - Intelligence Finance System', 20, doc.internal.pageSize.height - 10);
    }

    doc.save(`Reporte_Rentabilidad_${entityName.replace(/\s+/g, '_')}_${now}.pdf`);
};
