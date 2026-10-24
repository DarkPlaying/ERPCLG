
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
    console.log("Diagnosing 'marks' table...");
    const { data: marks, error: marksError } = await supabase
        .from('marks')
        .select('*')
        .limit(1);

    if (marksError) {
        console.error("Error fetching marks:", marksError);
    } else if (marks && marks.length > 0) {
        console.log("Marks Row Keys:", Object.keys(marks[0]));
        console.log("Sample Mark:", marks[0]);
    } else {
        console.log("No marks found in table.");
    }

    console.log("\nDiagnosing 'workspaces' table logic (student: jane@example.com)...");
    const { data: workspaces, error: wsError } = await supabase
        .from('workspaces')
        .select('*')
        // Try exact match in JSON array
        .contains('students', ['jane@example.com']);

    if (wsError) console.error("WS Error:", wsError);
    else console.log("Workspaces found for jane@example.com:", workspaces?.length, workspaces?.map(w => w.id));

    // Try finding via plain select to verify 'students' content
    const { data: allWorkspaces } = await supabase
        .from('workspaces')
        .select('id, students')
        .limit(5);

    if (allWorkspaces) {
        console.log("Sample Workspaces Students:", allWorkspaces.map(w => ({ id: w.id, students: w.students })));
    }
}

diagnose();
