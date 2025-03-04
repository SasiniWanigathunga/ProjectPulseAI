import "./global.css"

export const metadata = {
    title: "ProjectPulseAI",
    description: "The place to go for all your project management needs",
}

const RootLayout = ({ children }) => {
    return (
        <html lang="en" data-arp="">
            <body>{children}</body>
        </html>

    )
}

export default RootLayout