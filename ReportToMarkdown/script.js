// Report to Markdown Converter JavaScript

async function convertToMarkdown() {
    const fileInput = document.getElementById('docxFile');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please select a .docx file first');
        return;
    }
    
    if (!file.name.endsWith('.docx')) {
        alert('Please select a valid .docx file');
        return;
    }
    
    try {
        // Convert Word document to HTML using Mammoth.js
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        
        // Display HTML output
        document.getElementById('htmlOutput').innerHTML = result.value;
        
        // Convert HTML to Markdown (basic conversion)
        const markdown = htmlToMarkdown(result.value);
        document.getElementById('markdownOutput').textContent = markdown;
        
        // Log any conversion messages/warnings
        if (result.messages.length > 0) {
            console.log('Conversion messages:', result.messages);
        }
        
    } catch (error) {
        console.error('Error converting document:', error);
        alert('Error converting document: ' + error.message);
    }
}

function htmlToMarkdown(html) {
    // Enhanced HTML to GitHub Flavored Markdown conversion
    let markdown = html;
    
    // Tables (GitHub Flavored Markdown)
    markdown = markdown.replace(/<table[^>]*>(.*?)<\/table>/gis, (match, content) => {
        let table = '\n';
        const rows = content.match(/<tr[^>]*>.*?<\/tr>/gis) || [];
        
        rows.forEach((row, index) => {
            const cells = row.match(/<t[hd][^>]*>.*?<\/t[hd]>/gis) || [];
            const cellData = cells.map(cell => 
                cell.replace(/<t[hd][^>]*>(.*?)<\/t[hd]>/gi, '$1').trim()
            );
            
            if (cellData.length > 0) {
                table += '| ' + cellData.join(' | ') + ' |\n';
                
                // Add header separator for first row
                if (index === 0) {
                    table += '|' + ' --- |'.repeat(cellData.length) + '\n';
                }
            }
        });
        
        return table + '\n';
    });
    
    // Code blocks (preserve formatting)
    markdown = markdown.replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gis, '```\n$1\n```\n\n');
    markdown = markdown.replace(/<pre[^>]*>(.*?)<\/pre>/gis, '```\n$1\n```\n\n');
    
    // Inline code
    markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');
    
    // Blockquotes
    markdown = markdown.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, (match, content) => {
        const lines = content.split('\n');
        return lines.map(line => line.trim() ? '> ' + line.trim() : '>').join('\n') + '\n\n';
    });
    
    // Strikethrough (GitHub Flavored Markdown)
    markdown = markdown.replace(/<del[^>]*>(.*?)<\/del>/gi, '~~$1~~');
    markdown = markdown.replace(/<s[^>]*>(.*?)<\/s>/gi, '~~$1~~');
    markdown = markdown.replace(/<strike[^>]*>(.*?)<\/strike>/gi, '~~$1~~');
    
    // Headers
    markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
    markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
    markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
    markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');
    markdown = markdown.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n');
    markdown = markdown.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n');
    
    // Horizontal rules
    markdown = markdown.replace(/<hr[^>]*>/gi, '\n---\n\n');
    
    // Bold and italic (GitHub style)
    markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
    markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
    markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
    markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
    
    // Lists (improved)
    let listDepth = 0;
    markdown = markdown.replace(/<ul[^>]*>/gi, () => { listDepth++; return ''; });
    markdown = markdown.replace(/<\/ul>/gi, () => { listDepth--; return '\n'; });
    markdown = markdown.replace(/<ol[^>]*>/gi, () => { listDepth++; return ''; });
    markdown = markdown.replace(/<\/ol>/gi, () => { listDepth--; return '\n'; });
    
    // List items with proper indentation
    markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gi, (match, content) => {
        const indent = '  '.repeat(Math.max(0, listDepth - 1));
        return indent + '- ' + content.trim() + '\n';
    });
    
    // Links (GitHub style)
    markdown = markdown.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');
    
    // Images (GitHub style)
    markdown = markdown.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, '![$2]($1)');
    markdown = markdown.replace(/<img[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*>/gi, '![$1]($2)');
    markdown = markdown.replace(/<img[^>]*src="([^"]*)"[^>]*>/gi, '![]($1)');
    
    // Line breaks (GitHub treats single line breaks as spaces, double as new paragraphs)
    markdown = markdown.replace(/<br[^>]*>/gi, '  \n'); // Two spaces + newline for hard line break
    
    // Paragraphs
    markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gis, '$1\n\n');
    
    // Remove remaining HTML tags
    markdown = markdown.replace(/<[^>]*>/g, '');
    
    // Clean up extra whitespace (GitHub style)
    markdown = markdown.replace(/\n{3,}/g, '\n\n'); // Max 2 consecutive newlines
    markdown = markdown.replace(/[ \t]+$/gm, ''); // Remove trailing spaces
    markdown = markdown.trim();
    
    // Ensure proper spacing around headers
    markdown = markdown.replace(/^(#{1,6}\s)/gm, '\n$1');
    markdown = markdown.replace(/\n\n\n+(#{1,6}\s)/g, '\n\n$1');
    
    return markdown.trim();
}

function copyMarkdown() {
    const markdownText = document.getElementById('markdownOutput').textContent;
    if (markdownText && markdownText !== 'Upload a .docx file to see Markdown output here...') {
        navigator.clipboard.writeText(markdownText).then(() => {
            alert('Markdown copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy: ', err);
            alert('Failed to copy to clipboard');
        });
    } else {
        alert('No markdown content to copy');
    }
}
