import PromptSuggestionButton from "./PromptSuggestionButton";

const PromptSuggestionsRow = ( { onPromptClick }) => {
    const prompts = [
        "What are the available issues in Jira for Mobile Banking Application Development project?",
        "Who is responsible for the UI/UX design of the Mobile Banking Application Development project?",
        "What is the status of the Mobile Banking Application Development project?",
        "What is the allocated budget for the Mobile Banking Application Development project?",
        "What is the timeline for the Mobile Banking Application Development project?",
        "What are the risks and provide mitigation plan for the Mobile Banking Application Development project?",
    ]
    return (
        <div className="prompt-suggestion-row">
             {prompts.map((prompt, index) => 
                <PromptSuggestionButton 
                    key={`suggestion-${index}`} 
                    text={prompt} 
                    onClick={ () => onPromptClick(prompt)}
                />)}
        </div>
    )
}

export default PromptSuggestionsRow