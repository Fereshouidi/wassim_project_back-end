export const sanitizeMessages = (msgs: any[]) => msgs.map(m => {
    // Only keep allowed properties for each role to avoid API errors
    const cleaned: any = {
        role: m.role,
        content: m.content || ""
    };

    if (m.role === 'assistant') {
        if (m.tool_calls && m.tool_calls.length > 0) {
            cleaned.tool_calls = m.tool_calls;
        }
    } else if (m.role === 'tool') {
        cleaned.tool_call_id = m.tool_call_id;
        cleaned.name = m.name;
    } else if (m.role === 'user') {
        // user role should NOT have tool_calls or tool_call_id
        // even if they are null/undefined, some APIs complain if the key exists
    }

    return cleaned;
});
