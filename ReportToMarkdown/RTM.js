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
    // Basic HTML to Markdown conversion
    let markdown = html;
    
    // Headers
    markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
    markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
    markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
    markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');
    markdown = markdown.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n');
    markdown = markdown.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n');
    
    // Paragraphs
    markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
    
    // Bold and italic
    markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
    markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
    markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
    markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
    
    // Lists
    markdown = markdown.replace(/<ul[^>]*>/gi, '');
    markdown = markdown.replace(/<\/ul>/gi, '\n');
    markdown = markdown.replace(/<ol[^>]*>/gi, '');
    markdown = markdown.replace(/<\/ol>/gi, '\n');
    markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
    
    // Links
    markdown = markdown.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');
    
    // Line breaks
    markdown = markdown.replace(/<br[^>]*>/gi, '\n');
    
    // Remove remaining HTML tags
    markdown = markdown.replace(/<[^>]*>/g, '');
    
    // Clean up extra whitespace
    markdown = markdown.replace(/\n{3,}/g, '\n\n');
    markdown = markdown.trim();
    
    return markdown;
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

function updateHtmlPreview(){
    const markdown = document.getElementById('markdownOutput').value;
    // Simple Markdown to HTML conversion using marked.js (add the library to your project)
    if (window.marked) {
        document.getElementById('htmlOutput').innerHTML = marked.parse(markdown);
    } 
    else {
        document.getElementById('htmlOutput').innerText = "Markdown parser not loaded.";
    }
}
