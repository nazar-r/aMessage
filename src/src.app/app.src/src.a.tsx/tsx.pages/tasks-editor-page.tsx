const TasksEditorPageContent = () => (
    <div className="lobby-page">
        <div className="lobby-page__title">Add a first note</div>
        <div className="lobby-page__container"></div>
        <div className="lobby-page__text-field">
            <div className="lobby-page__text-field--edit">
                <svg className="lobby-page__text-field--icon" width="18" height="18" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7.34091 0H9.65909V17H7.34091V0Z" fill="white" />
                    <path d="M17 7.34091V9.65909L0 9.65909L1.01331e-07 7.34091L17 7.34091Z" fill="white" />
                </svg>
            </div>
            <div className="lobby-page__text-field--input"></div>
        </div>
    </div>
);

export default TasksEditorPageContent;