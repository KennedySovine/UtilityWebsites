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
    
    // Show loading indicator
    const htmlOutput = document.getElementById('htmlOutput');
    const markdownOutput = document.getElementById('markdownOutput');
    
    htmlOutput.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">Converting document...</div>';
    markdownOutput.value = 'Converting document...';
    
    try {
        // Convert Word document to HTML using Mammoth.js
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        
        // Check if conversion was successful
        if (!result.value) {
            throw new Error('Document conversion failed - no content was extracted');
        }
        
        // Display HTML output
        htmlOutput.innerHTML = result.value;
          // Convert HTML to Markdown
        const markdown = htmlToMarkdown(result.value);
        
        // Debug the conversion process
        debugConversion(result.value, markdown);
        
        // Check if markdown conversion was successful
        if (!markdown || markdown.trim().length === 0) {
            markdownOutput.value = 'No text content could be extracted from this document. The document may be empty or contain only images/graphics.';
        } else {
            markdownOutput.value = markdown;
            
            // Validate the output
            validateMarkdown(markdown);
        }
        
        // Log any conversion messages/warnings
        if (result.messages && result.messages.length > 0) {
            console.log('Conversion messages:', result.messages);
            
            // Show warnings if there are any
            const warnings = result.messages.filter(msg => msg.type === 'warning');
            if (warnings.length > 0) {
                console.warn('Conversion warnings:', warnings);
            }
        }
        
    } catch (error) {
        console.error('Error converting document:', error);
        
        // Show user-friendly error messages
        let errorMessage = 'Error converting document: ';
        if (error.message.includes('not supported')) {
            errorMessage += 'This file format is not supported. Please use a .docx file.';
        } else if (error.message.includes('corrupted') || error.message.includes('invalid')) {
            errorMessage += 'The file appears to be corrupted or invalid. Please try a different file.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
            errorMessage += 'Network error. Please check your internet connection and try again.';
        } else {
            errorMessage += error.message || 'Unknown error occurred.';
        }
        
        alert(errorMessage);
        
        // Reset the outputs
        htmlOutput.innerHTML = 'Upload a .docx file to see HTML output here...';
        markdownOutput.value = 'Upload a .docx file to see Markdown output here...';
    }
}

function htmlToMarkdown(html) {
    // Enhanced HTML to GitHub Flavored Markdown conversion
    let markdown = html;
    
    // First, clean up common Word document artifacts and encoding issues
    markdown = markdown
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/[\u2018\u2019]/g, "'") // Smart quotes
        .replace(/[\u201C\u201D]/g, '"') // Smart quotes
        .replace(/[\u2013\u2014]/g, '-') // En/em dashes
        .replace(/[\u2026]/g, '...') // Ellipsis
        .replace(/[\u00A0]/g, ' ') // Non-breaking space
        .replace(/[\u200B\u200C\u200D\uFEFF]/g, '') // Zero-width characters
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n');    // Tables (GitHub Flavored Markdown) - Enhanced for Word documents
    markdown = markdown.replace(/<table[^>]*>(.*?)<\/table>/gis, (match, content) => {
        let table = '\n';
        const rows = content.match(/<tr[^>]*>.*?<\/tr>/gis) || [];
        
        if (rows.length === 0) return '\n';
        
        rows.forEach((row, index) => {
            const cells = row.match(/<t[hd][^>]*>.*?<\/t[hd]>/gis) || [];
            const cellData = cells.map(cell => {
                // Clean up cell content - remove HTML tags and clean whitespace
                let cleanContent = cell.replace(/<t[hd][^>]*>(.*?)<\/t[hd]>/gi, '$1')
                    .replace(/<[^>]*>/g, '') // Remove any remaining HTML tags
                    .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
                    .replace(/[\u00A0]/g, ' ') // Non-breaking spaces
                    .trim();
                
                // Handle pipe characters in cell content (escape them)
                cleanContent = cleanContent.replace(/\|/g, '\\|');
                
                return cleanContent || ' '; // Ensure empty cells have a space
            });
            
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
      // Headers - Enhanced cleanup
    markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, (match, content) => {
        const cleanContent = content.replace(/<[^>]*>/g, '').trim();
        return cleanContent ? '# ' + cleanContent + '\n\n' : '';
    });
    markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, (match, content) => {
        const cleanContent = content.replace(/<[^>]*>/g, '').trim();
        return cleanContent ? '## ' + cleanContent + '\n\n' : '';
    });
    markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, (match, content) => {
        const cleanContent = content.replace(/<[^>]*>/g, '').trim();
        return cleanContent ? '### ' + cleanContent + '\n\n' : '';
    });
    markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, (match, content) => {
        const cleanContent = content.replace(/<[^>]*>/g, '').trim();
        return cleanContent ? '#### ' + cleanContent + '\n\n' : '';
    });
    markdown = markdown.replace(/<h5[^>]*>(.*?)<\/h5>/gi, (match, content) => {
        const cleanContent = content.replace(/<[^>]*>/g, '').trim();
        return cleanContent ? '##### ' + cleanContent + '\n\n' : '';
    });
    markdown = markdown.replace(/<h6[^>]*>(.*?)<\/h6>/gi, (match, content) => {
        const cleanContent = content.replace(/<[^>]*>/g, '').trim();
        return cleanContent ? '###### ' + cleanContent + '\n\n' : '';
    });
    
    // Horizontal rules
    markdown = markdown.replace(/<hr[^>]*>/gi, '\n---\n\n');
      // Bold and italic (GitHub style) - Enhanced for nested formatting
    markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, (match, content) => {
        const cleanContent = content.replace(/<[^>]*>/g, '').trim();
        return cleanContent ? '**' + cleanContent + '**' : '';
    });
    markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, (match, content) => {  
        const cleanContent = content.replace(/<[^>]*>/g, '').trim();
        return cleanContent ? '**' + cleanContent + '**' : '';
    });
    markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, (match, content) => {
        const cleanContent = content.replace(/<[^>]*>/g, '').trim();
        return cleanContent ? '*' + cleanContent + '*' : '';
    });
    markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, (match, content) => {
        const cleanContent = content.replace(/<[^>]*>/g, '').trim();
        return cleanContent ? '*' + cleanContent + '*' : '';
    });
      // Lists (improved) - Better handling of nested lists and Word formatting
    let listCounters = [];
    
    // Handle ordered lists with proper numbering
    markdown = markdown.replace(/<ol[^>]*>/gi, () => { 
        listCounters.push(1); 
        return ''; 
    });
    markdown = markdown.replace(/<\/ol>/gi, () => { 
        listCounters.pop(); 
        return '\n'; 
    });
    
    // Handle unordered lists
    markdown = markdown.replace(/<ul[^>]*>/gi, () => { 
        listCounters.push(0); 
        return ''; 
    });
    markdown = markdown.replace(/<\/ul>/gi, () => { 
        listCounters.pop(); 
        return '\n'; 
    });
    
    // List items with proper indentation and numbering
    markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gi, (match, content) => {
        const cleanContent = content.replace(/<[^>]*>/g, '').trim();
        if (!cleanContent) return '';
        
        const depth = Math.max(0, listCounters.length - 1);
        const indent = '  '.repeat(depth);
        
        if (listCounters[listCounters.length - 1] === 0) {
            // Unordered list
            return indent + '- ' + cleanContent + '\n';
        } else {
            // Ordered list
            const num = listCounters[listCounters.length - 1]++;
            return indent + num + '. ' + cleanContent + '\n';
        }
    });
      // Links (GitHub style) - Enhanced cleanup
    markdown = markdown.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, (match, href, text) => {
        const cleanText = text.replace(/<[^>]*>/g, '').trim();
        const cleanHref = href.trim();
        return cleanText && cleanHref ? `[${cleanText}](${cleanHref})` : cleanText || cleanHref || '';
    });
      // Images (GitHub style) - Replace data URIs with placeholder
    markdown = markdown.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, (match, src, alt) => {
        if (src.startsWith('data:')) {
            return `![Image is not available](# "${alt || 'Image'}")`;
        }
        return `![${alt}](${src})`;
    });
    markdown = markdown.replace(/<img[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*>/gi, (match, alt, src) => {
        if (src.startsWith('data:')) {
            return `![Image is not available](# "${alt || 'Image'}")`;
        }
        return `![${alt}](${src})`;
    });
    markdown = markdown.replace(/<img[^>]*src="([^"]*)"[^>]*>/gi, (match, src) => {
        if (src.startsWith('data:')) {
            return `![Image is not available](# "Image")`;
        }
        return `![](${src})`;
    });
    
    // Line breaks (GitHub treats single line breaks as spaces, double as new paragraphs)
    markdown = markdown.replace(/<br[^>]*>/gi, '  \n'); // Two spaces + newline for hard line break
      // Paragraphs - Better handling of Word document paragraphs
    markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gis, (match, content) => {
        const cleanContent = content.replace(/<[^>]*>/g, '').trim();
        return cleanContent ? cleanContent + '\n\n' : '\n';
    });
      // Remove remaining HTML tags and clean up
    markdown = markdown.replace(/<[^>]*>/g, '');
    
    // Clean up extra whitespace and fix common formatting issues
    markdown = markdown
        .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
        .replace(/[ \t]+$/gm, '') // Remove trailing spaces
        .replace(/^\s+$/gm, '') // Remove lines with only whitespace
        .replace(/\*\*\s*\*\*/g, '') // Remove empty bold tags
        .replace(/\*\s*\*/g, '') // Remove empty italic tags
        .replace(/~~\s*~~/g, '') // Remove empty strikethrough tags
        .replace(/`\s*`/g, '') // Remove empty code tags
        .replace(/\[\s*\]\(\s*\)/g, '') // Remove empty links
        .trim();
    
    // Ensure proper spacing around headers (but don't add extra newlines at start)
    markdown = markdown.replace(/^(#{1,6}\s)/gm, (match, header, offset) => {
        // Only add newline before header if it's not at the start and not already preceded by newline
        return offset > 0 && markdown[offset - 1] !== '\n' ? '\n' + header : header;
    });
    
    // Clean up any remaining multiple newlines after header processing
    markdown = markdown.replace(/\n{3,}/g, '\n\n');
    
    return markdown.trim();
}

// Additional utility functions for better Word document handling

function debugConversion(originalHtml, finalMarkdown) {
    console.group('📋 Conversion Debug Info');
    console.log('Original HTML length:', originalHtml.length);
    console.log('Final Markdown length:', finalMarkdown.length);
    console.log('HTML preview (first 500 chars):', originalHtml.substring(0, 500));
    console.log('Markdown preview (first 500 chars):', finalMarkdown.substring(0, 500));
    console.groupEnd();
}

function validateMarkdown(markdown) {
    const issues = [];
    
    // Check for common issues
    if (markdown.includes('undefined') || markdown.includes('null')) {
        issues.push('Contains undefined/null values');
    }
    
    if (markdown.includes('&') && !markdown.includes('&amp;') && !markdown.includes('&lt;')) {
        issues.push('May contain unescaped HTML entities');
    }
    
    if (markdown.length < 10) {
        issues.push('Very short content - document may be mostly images or complex formatting');
    }
    
    if (issues.length > 0) {
        console.warn('Markdown validation issues:', issues);
    }
    
    return issues;
}

// Enhanced copy function with validation
function copyMarkdown() {
    const markdownText = document.getElementById('markdownOutput').value;
    if (!markdownText || markdownText === 'Upload a .docx file to see Markdown output here...' || markdownText === 'Converting document...') {
        alert('No markdown content to copy');
        return;
    }
    
    // Validate before copying
    const issues = validateMarkdown(markdownText);
    if (issues.length > 0) {
        const proceed = confirm(`Markdown validation found some issues:\n${issues.join(', ')}\n\nDo you still want to copy?`);
        if (!proceed) return;
    }
    
    navigator.clipboard.writeText(markdownText).then(() => {
        alert('Markdown copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy:', err);
        // Fallback for older browsers
        try {
            const textArea = document.createElement('textarea');
            textArea.value = markdownText;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('Markdown copied to clipboard!');
        } catch (fallbackError) {
            console.error('Fallback copy failed:', fallbackError);
            alert('Failed to copy to clipboard. Please select the text manually and copy it.');
        }
    });
}
