import { useFetchingUsers } from "../tsx.extensions/getApi/use.get.users.api";
import { useNavigate } from 'react-router-dom';
import { Menu } from '../tsx.items/items.menu/menu';

const ChoosingUserPageContent = () => {
    const navigate = useNavigate();
    const { data: users } = useFetchingUsers();

    return (
        <>
            <div className="list-page">
                <div className="list-page__title">Your Contacts</div>
                <ul className="list-page__list">
                    {users?.map(user => (
                        <li key={user.userId} className="list-page__list-item" onClick={() => navigate("/chat", { state: { peerWsId: user.userId } })}>
                            <div className="list-page__list-item--image"></div>
                            <div className="list-page__list-item--name">{user.userName}</div>
                            <div className="list-page__list-item--status">{user.userStatus}</div>
                        </li>
                    ))}
                </ul>
            </div>
            <Menu />
        </>
    );
};

export default ChoosingUserPageContent;