import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AACPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const basicNeeds = [
        { icon: "restaurant", label: "Hungry", color: "coral" },
        { icon: "local_drink", label: "Thirsty", color: "teal" },
        { icon: "wc", label: "Bathroom", color: "lavender" },
        { icon: "bed", label: "Tired", color: "primary" },
        { icon: "sentiment_very_dissatisfied", label: "Hurt", color: "coral" },
        { icon: "help", label: "Help", color: "amber" },
    ];

    const emotions = [
        { icon: "sentiment_very_satisfied", label: "Happy", color: "primary" },
        { icon: "sentiment_dissatisfied", label: "Sad", color: "teal" },
        { icon: "sentiment_very_dissatisfied", label: "Angry", color: "coral" },
        { icon: "psychology", label: "Worried", color: "lavender" },
        { icon: "sentiment_calm", label: "Calm", color: "sage" },
        { icon: "sentiment_excited", label: "Excited", color: "amber" },
        { icon: "sick", label: "Sick", color: "coral" },
        { icon: "favorite", label: "Love", color: "coral" },
    ];

    const responses = [
        { icon: "thumb_up", label: "Yes", color: "primary" },
        { icon: "thumb_down", label: "No", color: "coral" },
        { icon: "more_horiz", label: "More", color: "teal" },
        { icon: "done", label: "Done", color: "sage" },
        { icon: "pause", label: "Wait", color: "amber" },
        { icon: "replay", label: "Again", color: "lavender" },
    ];

    const activities = [
        { icon: "toys", label: "Play", color: "primary" },
        { icon: "menu_book", label: "Read", color: "teal" },
        { icon: "music_note", label: "Music", color: "lavender" },
        { icon: "sports_soccer", label: "Outside", color: "sage" },
        { icon: "tv", label: "Watch", color: "amber" },
        { icon: "brush", label: "Art", color: "coral" },
    ];

    const people = [
        { icon: "woman", label: "Mom", color: "lavender" },
        { icon: "man", label: "Dad", color: "teal" },
        { icon: "face", label: "Friend", color: "primary" },
        { icon: "school", label: "Teacher", color: "sage" },
        { icon: "medical_services", label: "Doctor", color: "coral" },
        { icon: "family_restroom", label: "Family", color: "amber" },
    ];

    const categories = [
        { title: "Basic Needs", items: basicNeeds, id: "needs" },
        { title: "Feelings & Emotions", items: emotions, id: "emotions" },
        { title: "Responses", items: responses, id: "responses" },
        { title: "Activities", items: activities, id: "activities" },
        { title: "People", items: people, id: "people" },
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/guidance"
                    className="p-2 rounded-xl hover:bg-sage-100 dark:hover:bg-sage-800 transition-colors"
                >
                    <span className="material-symbols-rounded text-sage-600 dark:text-sage-400">
                        arrow_back
                    </span>
                </Link>
                <div>
                    <h1 className="text-2xl font-semibold text-sage-900 dark:text-white">
                        Communication Board
                    </h1>
                    <p className="text-sage-600 dark:text-sage-400">
                        Visual communication cards and AAC resources
                    </p>
                </div>
            </div>

            {/* Introduction */}
            <div className="card p-6 bg-linear-to-br from-lavender-50 to-primary-50 dark:from-lavender-900/20 dark:to-primary-900/20 border-0">
                <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white dark:bg-sage-800 shadow-sm flex items-center justify-center shrink-0">
                        <span className="material-symbols-rounded text-lavender-600 dark:text-lavender-400 text-3xl">
                            chat
                        </span>
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-sage-900 dark:text-white mb-2">
                            Alternative & Augmentative Communication (AAC)
                        </h2>
                        <p className="text-sage-700 dark:text-sage-300">
                            AAC tools help children communicate their needs, feelings, and thoughts through pictures
                            and symbols. These visual supports can be used alongside speech or as a primary
                            communication method. Tap any card to hear it spoken aloud.
                        </p>
                    </div>
                </div>
            </div>

            {/* Communication Categories */}
            {categories.map((category) => (
                <div key={category.id}>
                    <h2 className="text-lg font-semibold text-sage-900 dark:text-white mb-4">
                        {category.title}
                    </h2>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        {category.items.map((item, index) => (
                            <button
                                key={index}
                                className={`card p-4 flex flex-col items-center gap-2 hover:shadow-lg transition-all active:scale-95 border-2 border-transparent hover:border-${item.color}-300 dark:hover:border-${item.color}-600`}
                            >
                                <div className={`w-14 h-14 rounded-2xl bg-${item.color}-100 dark:bg-${item.color}-900/30 flex items-center justify-center`}>
                                    <span className={`material-symbols-rounded text-${item.color}-600 dark:text-${item.color}-400 text-3xl`}>
                                        {item.icon}
                                    </span>
                                </div>
                                <span className="text-sm font-medium text-sage-900 dark:text-white text-center">
                                    {item.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            ))}

            {/* Quick Phrases */}
            <div className="card p-6">
                <h2 className="text-lg font-semibold text-sage-900 dark:text-white mb-4">
                    Quick Phrases
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                        { phrase: "I need a break", icon: "self_improvement" },
                        { phrase: "I don't understand", icon: "help" },
                        { phrase: "Can you help me?", icon: "support_agent" },
                        { phrase: "I feel overwhelmed", icon: "psychology" },
                        { phrase: "Too loud", icon: "volume_off" },
                        { phrase: "I want to go home", icon: "home" },
                    ].map((item, index) => (
                        <button
                            key={index}
                            className="flex items-center gap-4 p-4 bg-sage-50 dark:bg-sage-800 rounded-xl hover:bg-sage-100 dark:hover:bg-sage-700 transition-colors"
                        >
                            <div className="w-12 h-12 rounded-xl bg-white dark:bg-sage-700 shadow-sm flex items-center justify-center">
                                <span className="material-symbols-rounded text-sage-600 dark:text-sage-400 text-2xl">
                                    {item.icon}
                                </span>
                            </div>
                            <span className="font-medium text-sage-900 dark:text-white">
                                {item.phrase}
                            </span>
                            <span className="material-symbols-rounded text-sage-400 ml-auto">
                                volume_up
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Sentence Builder */}
            <div className="card p-6 border-2 border-dashed border-sage-200 dark:border-sage-700">
                <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-rounded text-teal-600 dark:text-teal-400 text-3xl">
                            format_quote
                        </span>
                    </div>
                    <h3 className="text-lg font-semibold text-sage-900 dark:text-white mb-2">
                        Sentence Builder
                    </h3>
                    <p className="text-sage-600 dark:text-sage-400 mb-4 max-w-md mx-auto">
                        Create custom sentences by combining cards. Great for building communication skills.
                    </p>

                    {/* Sentence strip */}
                    <div className="flex items-center justify-center gap-2 p-4 bg-sage-50 dark:bg-sage-800 rounded-xl mb-4 min-h-20">
                        <div className="flex items-center gap-1 text-sage-400">
                            <span className="material-symbols-rounded">add_circle</span>
                            <span className="text-sm">Tap cards above to build a sentence</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-3">
                        <button className="btn-secondary">
                            <span className="material-symbols-rounded mr-2">delete</span>
                            Clear
                        </button>
                        <button className="btn-primary">
                            <span className="material-symbols-rounded mr-2">volume_up</span>
                            Speak
                        </button>
                    </div>
                </div>
            </div>

            {/* Tips */}
            <div className="card p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <h3 className="font-semibold text-amber-800 dark:text-amber-200 flex items-center gap-2 mb-3">
                    <span className="material-symbols-rounded">lightbulb</span>
                    Tips for Using AAC
                </h3>
                <ul className="space-y-2 text-sm text-amber-700 dark:text-amber-300">
                    <li className="flex items-start gap-2">
                        <span className="material-symbols-rounded text-sm mt-0.5">check_circle</span>
                        <span>Model using the board yourself - point to pictures as you speak</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="material-symbols-rounded text-sm mt-0.5">check_circle</span>
                        <span>Accept any attempt at communication and respond positively</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="material-symbols-rounded text-sm mt-0.5">check_circle</span>
                        <span>Keep communication boards available and accessible at all times</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="material-symbols-rounded text-sm mt-0.5">check_circle</span>
                        <span>Work with a speech-language pathologist to develop personalized AAC strategies</span>
                    </li>
                </ul>
            </div>

        </div>
    );
}
