import { motion } from "framer-motion";
import { useLobbyPage } from '../tsx.items/use.loby.page';
import Menu from '../tsx.items/items.menu/menu';

const LobbyPageContent = () => {
    const { viewportRef, trackRef, localNotes, defEdit, switchEdit, scroll, createNote, saveNote, deleteNote, setLocalNotes } = useLobbyPage();

    return (
        <div>
            <div className="chat-page">
                <div className="chat-page__title">Your Notes</div>
                <div className="chat-page__viewport" ref={viewportRef} style={{ overflow: "hidden", position: "relative" }}>
                    <motion.div ref={trackRef} className="chat-page__container" drag="x" style={{ display: "flex" }}>
                        <svg onClick={createNote} className="chat-page__container--add" width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg"><g opacity="1"><path d="M7.34091 0H9.65909V17H7.34091V0Z" fill="white" /><path d="M17 7.34091V9.65909L0 9.65909L0 7.34091L17 7.34091Z" fill="white" /></g></svg>

                        {localNotes.map(note => (
                            <div key={note.noteId} id={note.noteId} className="chat-note" style={{ flexShrink: 0, minWidth: 280 }}>
                                <textarea className="chat-note__field" placeholder="Apply Text" value={note.content} onChange={e => setLocalNotes(prev => prev.map(n => n.noteId === note.noteId ? { ...n, content: e.target.value } : n))} />
                                <div className="chat-note__hidden">
                                    <div className="chat-note__hidden--item" onClick={e => { e.stopPropagation(); defEdit ? saveNote(note) : switchEdit(e); }}>
                                        {defEdit
                                            ? <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-check"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                            : <svg className="chat-note__hidden--item__icon" width="14" height="14" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg"><path opacity="0.85" d="M12.8054 3.35851L15.4766 6.03033M10.4444 17.9996H18M1 18L1.04481 17.6863C1.2034 16.576 1.28269 16.0208 1.46305 15.5025C1.6231 15.0427 1.84173 14.6053 2.11356 14.2013C2.41989 13.746 2.81635 13.3494 3.60925 12.5564L14.6101 1.55335C15.3478 0.815555 16.5438 0.815546 17.2815 1.55335C18.0191 2.29115 18.0191 3.48736 17.2815 4.22516L6.07869 15.43C5.35936 16.1496 4.99969 16.5093 4.59002 16.7954C4.22639 17.0493 3.83421 17.2597 3.42154 17.4222C2.95662 17.6051 2.45799 17.7057 1.46082 17.907L1 18Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        }
                                        <div className="chat-note__hidden--item__edit">{defEdit ? "Save" : "Edit"}</div>
                                    </div>

                                    <div className="chat-note__hidden--item">
                                        <svg className="chat-note__hidden--item__icon-1" width="14" height="14" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg"><g opacity="1"><path d="M7.34091 0H9.65909V17H7.34091V0Z" fill="currentColor" /><path d="M17 7.34091V9.65909L0 9.65909L0 7.34091L17 7.34091Z" fill="currentColor" /></g></svg>
                                        <div className="chat-note__hidden--item__edit" onClick={() => deleteNote(note.noteId)}>Delete</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </div>

                <div className="chat-page__button">
                    <svg onClick={() => scroll("left")} xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="chat-page__button--icon"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    <svg onClick={() => scroll("right")} xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="chat-page__button--icon"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </div>
            </div>
            <Menu />
        </div>
    );
};

export default LobbyPageContent;