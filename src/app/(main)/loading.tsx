export default function Loading() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-20 animate-pulse">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center mb-4">
                <div className="w-6 h-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            </div>
            <div className="space-y-3 w-full max-w-md">
                <div className="h-4 bg-muted rounded-lg w-3/4 mx-auto" />
                <div className="h-3 bg-muted rounded-lg w-1/2 mx-auto" />
            </div>
        </div>
    );
}
