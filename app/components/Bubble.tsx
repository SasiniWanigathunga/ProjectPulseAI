import React from 'react';
import ReactMarkdown from 'react-markdown';

const Bubble = ({ message }) => {
    const { content, role } = message;

    // Function to extract <think> content and main response
    const parseContent = (text) => {
        const thinkMatch = text.match(/<think>(.*?)<\/think>/s);
        const thinkContent = thinkMatch ? thinkMatch[1].trim() : null;
        const mainContent = text.replace(/<think>.*?<\/think>/s, '').trim();
        return { thinkContent, mainContent };
    };

    const { thinkContent, mainContent } = parseContent(content);

    return (
        <div className={`${role} bubble`}>
            {thinkContent && (
                <div className="think-box">
                    <strong>Thinking:</strong>
                    <ReactMarkdown>{thinkContent}</ReactMarkdown>
                </div>
            )}
            <div className="response-box">
                <ReactMarkdown>{mainContent}</ReactMarkdown>
            </div>
        </div>
    );
};

export default Bubble;
