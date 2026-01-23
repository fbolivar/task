export type FinancialRecordType = 'Ingreso' | 'Gasto';

export interface FinancialRecord {
    id: string;
    project_id: string;
    entity_id: string;
    type: FinancialRecordType;
    category: string;
    amount: number;
    description: string | null;
    date: string;
    created_at: string;
    updated_at: string;
    project?: {
        name: string;
    };
    entity?: {
        name: string;
    };
}

export interface BudgetLine {
    id: string;
    project_id: string;
    category: string;
    planned_amount: number;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface FinancialSummary {
    total_income: number;
    total_expenses: number;
    net_profit: number;
    profit_margin: number;
    budget_execution: number;
}

export interface ProjectFinanceStats extends FinancialSummary {
    projectId: string;
    projectName: string;
}
