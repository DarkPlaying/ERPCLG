import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Loader2, FileDown, Table as TableIcon, RefreshCw, Copy, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

export const AICsvGenerator = () => {
    const [vanoStart, setVanoStart] = useState('1');
    const [vanoEnd, setVanoEnd] = useState('2');
    const [department, setDepartment] = useState('BSC');
    const [role, setRole] = useState('student');
    const [instructions, setInstructions] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedCsv, setGeneratedCsv] = useState('');
    const [previewData, setPreviewData] = useState<string[][]>([]);

    // New Feature States
    const [emailDomain, setEmailDomain] = useState('@velsrscollege.com');
    const [passwordType, setPasswordType] = useState('complex'); // simple, complex

    const generatePassword = (length = 10) => {
        const simpleChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        const complexChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        const charset = passwordType === 'complex' ? complexChars : simpleChars;

        let retVal = "";
        for (let i = 0, n = charset.length; i < length; ++i) {
            retVal += charset.charAt(Math.floor(Math.random() * n));
        }
        return retVal;
    };

    const handleGenerate = async () => {
        const start = parseInt(vanoStart);
        const end = parseInt(vanoEnd);

        if (isNaN(start) || isNaN(end)) {
            toast.error("Invalid VANO numbers");
            return;
        }

        if (start >= end) {
            toast.error("Start number must be less than End number");
            return;
        }

        const count = end - start + 1;

        // Validation limits
        if (!instructions && count > 50000) {
            toast.error("Limit exceeded: Max 50,000 users for basic generation");
            return;
        }
        if (instructions && count > 290) {
            toast.error("Limit exceeded: Max 290 users for AI editing");
            return;
        }

        setIsGenerating(true);
        setGeneratedCsv('');
        setPreviewData([]);

        try {
            // 1. Generate Base Data
            const rows = [];
            rows.push(["name", "email", "password", "role", "department"]);

            for (let i = start; i <= end; i++) {
                rows.push([
                    String(i),
                    `${i}${emailDomain}`,
                    generatePassword(),
                    role,
                    department
                ]);
            }

            let finalCsv = rows.map(r => r.join(",")).join("\n");

            // 2. Apply AI Instructions if needed
            if (instructions.trim()) {
                const effectiveApiKey = apiKey || import.meta.env.VITE_GEMINI_API_KEY;
                if (!effectiveApiKey) {
                    throw new Error("API Key required for AI features");
                }

                const genAI = new GoogleGenerativeAI(effectiveApiKey);
                const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

                const prompt = `You are an expert CSV editor.
Here is a user list CSV:
${finalCsv}

Apply this specific instruction to modify the CSV data: "${instructions}"

Requirements:
1. Output ONLY the valid CSV data.
2. Do NOT add any markdown formatting (like \`\`\`csv).
3. Do NOT add explanations.
4. Maintain the same header structure.`;

                const result = await model.generateContent(prompt);
                const responseText = result.response.text();
                // Clean cleanup any potential markdown
                finalCsv = responseText.replace(/```csv/g, '').replace(/```/g, '').trim();
            }

            setGeneratedCsv(finalCsv);

            // Parse for preview (top 5 rows)
            const parsedRows = finalCsv.split('\n').map(row => row.split(','));
            setPreviewData(parsedRows.slice(0, 6)); // Header + 5 rows

            toast.success("CSV Generated Successfully!");

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Generation Failed");
        } finally {
            setIsGenerating(false);
        }
    };

    const downloadCsv = () => {
        if (!generatedCsv) return;
        const blob = new Blob([generatedCsv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', 'user_list.csv');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success("Downloaded user_list.csv");
    };

    const downloadJson = () => {
        if (!generatedCsv) return;
        const lines = generatedCsv.split('\n');
        const headers = lines[0].split(',');
        const result = lines.slice(1).map(line => {
            const obj: any = {};
            const currentline = line.split(',');
            headers.forEach((header, i) => {
                obj[header] = currentline[i];
            });
            return obj;
        });

        const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', 'user_list.json');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success("Downloaded user_list.json");
    };

    const copyToClipboard = () => {
        if (!generatedCsv) return;
        navigator.clipboard.writeText(generatedCsv);
        toast.success("Copied to clipboard");
    };

    return (
        <div className="space-y-6 w-full">
            <div className="flex flex-col gap-1.5">
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <TableIcon className="h-6 w-6 text-foreground" />
                    VANO User List Generator
                </h1>
                <p className="text-xs text-muted-foreground">Generate bulk user CSVs with optional AI-powered filtering and modification.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Configuration Panel */}
                <Card className="bg-card border-border text-foreground lg:col-span-1 h-fit shadow-xs">
                    <CardHeader className="pb-3 border-b border-border">
                        <CardTitle className="text-sm font-semibold text-foreground">Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs text-foreground font-medium">Start VANO</Label>
                                <Input
                                    type="number"
                                    value={vanoStart}
                                    onChange={e => setVanoStart(e.target.value)}
                                    className="bg-background border-border text-foreground h-9"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-foreground font-medium">End VANO</Label>
                                <Input
                                    type="number"
                                    value={vanoEnd}
                                    onChange={e => setVanoEnd(e.target.value)}
                                    className="bg-background border-border text-foreground h-9"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs text-foreground font-medium">Email Domain</Label>
                            <Input
                                value={emailDomain}
                                onChange={e => setEmailDomain(e.target.value)}
                                placeholder="@yourcollege.com"
                                className="bg-background border-border text-foreground h-9"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs text-foreground font-medium">Password Complexity</Label>
                            <Select value={passwordType} onValueChange={setPasswordType}>
                                <SelectTrigger className="bg-background border-border text-foreground h-9">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-border text-foreground">
                                    <SelectItem value="simple">Simple (Alphanumeric)</SelectItem>
                                    <SelectItem value="complex">Complex (Special Chars)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs text-foreground font-medium">Department</Label>
                                <Input
                                    value={department}
                                    onChange={e => setDepartment(e.target.value)}
                                    className="bg-background border-border text-foreground h-9"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-foreground font-medium">Role</Label>
                                <Select value={role} onValueChange={setRole}>
                                    <SelectTrigger className="bg-background border-border text-foreground h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card border-border text-foreground">
                                        <SelectItem value="student">Student</SelectItem>
                                        <SelectItem value="teacher">Teacher</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="flex justify-between text-xs text-foreground font-medium">
                                <span>AI Instructions (Optional)</span>
                                <span className="text-[11px] text-muted-foreground font-normal">Max 290 users</span>
                            </Label>
                            <Textarea
                                placeholder="e.g. Don't add user 610, and make user 615 a teacher."
                                value={instructions}
                                onChange={e => setInstructions(e.target.value)}
                                className="bg-background border-border text-foreground min-h-[80px] text-xs"
                            />
                        </div>

                        {/* API Key Section */}
                        <div className="space-y-3 pt-3 border-t border-border">
                            <Label className="text-foreground flex justify-between items-center text-xs font-medium">
                                <span>Gemini API Key</span>
                                <span className="text-[11px] text-muted-foreground font-normal">(Optional if set in env)</span>
                            </Label>

                            <div className="flex gap-2">
                                <Input
                                    type="password"
                                    placeholder="Enter Key (Optional)"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    className="bg-background border-border text-foreground h-9 flex-1 text-xs"
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-border text-foreground bg-background hover:bg-muted text-xs h-9 font-medium"
                                    onClick={() => window.open('https://aistudio.google.com/app/apikey', '_blank')}
                                >
                                    Get Key
                                </Button>
                            </div>
                        </div>

                        <Button
                            className="w-full bg-foreground text-background hover:bg-foreground/90 font-semibold shadow-xs h-9"
                            onClick={handleGenerate}
                            disabled={isGenerating}
                        >
                            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                            Generate CSV
                        </Button>
                    </CardContent>
                </Card>

                {/* Preview Panel */}
                <Card className="bg-card border-border text-foreground lg:col-span-2 flex flex-col h-[600px] shadow-xs">
                    <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
                        <CardTitle className="text-sm font-semibold text-foreground">Data Preview</CardTitle>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-border text-foreground bg-background hover:bg-muted h-8"
                                onClick={copyToClipboard}
                                disabled={!generatedCsv}
                            >
                                <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-border text-foreground bg-background hover:bg-muted font-medium h-8"
                                onClick={downloadJson}
                                disabled={!generatedCsv}
                            >
                                <FileDown className="h-3.5 w-3.5 mr-1.5" /> .JSON
                            </Button>
                            <Button
                                size="sm"
                                className="bg-foreground text-background hover:bg-foreground/90 font-semibold h-8"
                                onClick={downloadCsv}
                                disabled={!generatedCsv}
                            >
                                <FileDown className="h-3.5 w-3.5 mr-1.5" /> .CSV
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto p-0">
                        {generatedCsv ? (
                            <div className="w-full">
                                <table className="w-full text-xs text-left">
                                    <thead className="text-[11px] text-muted-foreground uppercase bg-muted/40 sticky top-0 border-b border-border">
                                        <tr>
                                            {previewData[0]?.map((header, i) => (
                                                <th key={i} className="px-5 py-3 border-b border-border font-medium text-foreground">{header}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {previewData.slice(1).map((row, i) => (
                                            <tr key={i} className="hover:bg-muted/30 transition-colors">
                                                {row.map((cell, j) => (
                                                    <td key={j} className="px-5 py-3 font-mono text-foreground text-xs">{cell}</td>
                                                ))}
                                            </tr>
                                        ))}
                                        {generatedCsv.split('\n').length > 6 && (
                                            <tr>
                                                <td colSpan={5} className="px-5 py-3 text-center text-muted-foreground italic text-xs">
                                                    ... {generatedCsv.split('\n').length - 6} more rows ...
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                                <TableIcon className="h-12 w-12 opacity-30" />
                                <p className="text-xs">Generated data will appear here</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
