"use client"
import Image from "next/image"
import ProjectPulseAI from "./assets/ProjectPulseAI.png"
import { useChat } from "ai/react"
import { Message } from "ai"

import Bubble from "./components/Bubble"
import LoadingBubble from "./components/LoadingBubble"
import PromptSuggestionsRow from "./components/PromptSuggestionsRow"

const Home = () => {
    const {append, isLoading, messages, input, handleInputChange, handleSubmit} = useChat()
    const noMessages = !messages || messages.length === 0
    
    const handlePrompt = ( promptText) => {
        const msg: Message = {
            id: crypto.randomUUID(),
            content: promptText,
            role: "user"
        }
        append(msg)
    }

    return(
        <main>
            <Image src={ProjectPulseAI} width="150" alt="ProjectPulseAI Logo"/>
            <section className={noMessages ? "" : "populated"}>
                {noMessages ? (
                    <>
                        <p className="starter-text">
                            Welcome to F1GPT! Ask me anything about Formula 1 and I'll do my best to help you out.
                        </p>
                        <br/>
                        <PromptSuggestionsRow onPromptClick={handlePrompt}/>
                    </>
                ) : (
                    <>
                        { messages.map((message, index) => <Bubble key={`message-${index}`} message={message}/>)}
                        {isLoading && <LoadingBubble/>}
                    </>
                )}
            </section>
            <form onSubmit={handleSubmit}>
                <input className="question-box" onChange={handleInputChange} value={input} placeholder="Ask me something..."/>
                <input type="submit"/>
            </form>
        </main>
    )
}

export default Home