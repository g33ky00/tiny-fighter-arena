import { useState } from "react";

interface Props {
    shareUrl: string;
}

export default function ShareLink({ shareUrl }: Props) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            const input = document.createElement("input");
            input.value = shareUrl;
            document.body.appendChild(input);
            input.select();
            document.execCommand("copy");
            document.body.removeChild(input);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="share-link">
            <p>Share this battle:</p>
            <div className="share-row">
                <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button type="button" onClick={handleCopy}>
                    {copied ? "✓ Copied!" : "Copy"}
                </button>
            </div>
        </div>
    );
}
