import {useEffect, useState} from "react";
import {useCompletion} from "ai/react";
import {useWidgetApi} from "@beeper/matrix-widget-toolkit-react";
import {RoomAccountData, RoomEvent} from "@beeper/matrix-widget-toolkit-api";
import {getDisplayNameData, Message, processMessages, RoomMessageEvent} from "@/app/helpers";

function generatePrompt(messages: Message[], displayNameData: Record<string, string>) {
    const start_prompt = "Voici la transcription d'un chat avec mes amis:"

    const end_prompt = "Give a bullet-point summary that is detailed, thorough, and that accurately captures the conversation. Include names only to tell me who's backing up a claim or assertion. After reading your summary, my understanding of what happened should be as good as if I had read the messages myself. Give me details and specifics. Use active voice throughout. Only include links that would be genuinely useful for me to have. Write only the summary, without including text like \"Here\'s the summary\" or \"I hope this helped\". Be short, concise, and to the point. Reduce useless informations if possible. Say it in french."
    let messages_prompt = "";

    messages.forEach((message) => {
        let username = displayNameData[message.user] || message.user;
        messages_prompt += `\n${username}: ${message.content}`;
    })

    return `${start_prompt}\n\n${messages_prompt}\n\n${end_prompt}`;
}

export default function Content() {
    const [noMessages, setNoMessages] = useState(false);
    const [loading, setLoading] = useState(true);
    const [summarizing, setSummarizing] = useState(false);
    const [count, setCount] = useState(250);
    const [messageCount, setMessageCount] = useState(0);
    const [error, setError] = useState("");

    const { complete, completion } = useCompletion({
        api: '/api/completion',
        onResponse: (response) => {
            setLoading(false);
            setSummarizing(true);
        },
        onError: (error) => {
            setError(error.message);
        }
    })
    const widgetApi = useWidgetApi();

    async function fetchData(useUnread: boolean, limit: number = 500) {

        let roomEvents: RoomEvent<RoomMessageEvent>[];

        if (useUnread) {
            const fullyReadData: RoomAccountData<any>[] = await widgetApi.receiveRoomAccountData('m.fully_read');
            const fullyRead: string | undefined = fullyReadData[0].content.event_id;
            roomEvents = await widgetApi.receiveRoomEvents('m.room.message', {limit: limit, since: fullyRead});
        } else {
            roomEvents = await widgetApi.receiveRoomEvents('m.room.message', {limit: limit});
        }

        const messages = processMessages(roomEvents);
        const displayNameData = await getDisplayNameData(widgetApi);
        return {messages, displayNameData}
    }

    useEffect(() => {
        summarize(true);
    }, []);

    function summarize(useUnread: boolean, limit?: number) {
        setLoading(true);
        setNoMessages(false);

        fetchData(useUnread, limit).then(({messages, displayNameData}) => {
            if (messages.length === 0) {
                setNoMessages(true);
                setLoading(false);
            } else {
                setMessageCount(messages.length);
                complete(generatePrompt(messages, displayNameData));
            }
        })
    }

    if (error) {
        return <p>{ error }</p>
    }

    return (
        <div className="mt-5 p-3">
            { noMessages && (
                <>
                    <p className="font-medium font-sans text-gray-300">No new messages.</p>
                    <p className="font-bold font-sans text-xl mt-1">Summarize recent messages?</p>
                    <input className="block border-2 border-gray-200 px-2 py-2 w-20 mt-4 rounded-lg focus:ring focus:outline-none ring-gray-300 text-white bg-transparent" type="number" step="1" min="1" max="1000" onChange={(e) => setCount(parseInt(e.target.value))} value={count}/>
                    <button className="block rounded-lg px-10 py-3 text-center bg-black text-white mt-6 transition duration-300 hover:bg-gray-800" onClick={() => summarize(false, count)}>Summarize</button>
                </>
            )}

            { loading && (
                <>
                    <p>Computing...</p>
                </>
            )}

            { summarizing && (
                <>
                    <p className="font-semibold font-sans">{messageCount} messages:</p>
                    <pre className="max-w-full whitespace-pre-wrap font-sans">{completion}</pre>
                </>
            )}
        </div>
    )
}