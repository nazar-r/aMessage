import { useFetchingNotes } from '../tsx.extensions/getApi/use.get.content.api';
import { useRemovingNotes } from '../tsx.extensions/setApi/use.remove.content.api';
import { useCreatingNote } from "../tsx.extensions/setApi/use.send.content.api";
import { useUpdatingNote } from "../tsx.extensions/setApi/use.update.content.api";
import { useRef, useState, useEffect } from 'react';
import type { notesData } from '../tsx.extensions/types';

export const useLobbyPage = () => {
    const viewportRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const createNoteMutation = useCreatingNote(() => setText(""));
    const updateNoteMutation = useUpdatingNote();

    const removeNoteMutation = useRemovingNotes();
    const { data: notes = [] } = useFetchingNotes();
    const [localNotes, setLocalNotes] = useState<notesData[]>([]);

    useEffect(() => {
        setLocalNotes(notes);
    }, [notes]);

    const [defEdit, setEdit] = useState(false);
    const [text, setText] = useState("");
    const { mutate } = useCreatingNote(() => setText(""));

    const switchEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEdit(prev => !prev);
    };

    const scroll = (dir: "left" | "right") =>
        viewportRef.current?.scrollBy({ left: dir === "left" ? -300 : 300, behavior: "smooth" });

    const createNote = () => {
        const newNote: notesData = { noteId: "temp-" + Date.now(), content: "" };
        setLocalNotes(prev => [...prev, newNote]);
        setText("");
    };

    const saveNote = (note: notesData) => {
        if (!note.content.trim()) return;

        note.noteId.startsWith("temp-") || note.noteId === ""
            ? createNoteMutation.mutate(
                { noteId: "", content: note.content },
                {
                    onSuccess: (createdNote) => {
                        setLocalNotes(prev => prev.map(n => n.noteId === note.noteId ? createdNote : n));
                    },
                }
            )
            : updateNoteMutation.mutate(
                { noteId: note.noteId, data: { ...note } },
                {
                    onSuccess: (updatedNote) => {
                        setLocalNotes(prev => prev.map(n => n.noteId === note.noteId ? updatedNote : n));
                    },
                }
            );
    };

    const deleteNote = (noteId: string) => {
        const element = document.getElementById(noteId);
        element?.classList.add("lobby-note--fade");
        setTimeout(() => {
            removeNoteMutation.mutate(noteId);
            setLocalNotes(prev => prev.filter(note => note.noteId !== noteId));
        }, 200);
    };

    return {
        viewportRef,
        trackRef,
        localNotes,
        defEdit,
        text,
        switchEdit,
        scroll,
        createNote,
        saveNote,
        deleteNote,
        setLocalNotes
    };
};