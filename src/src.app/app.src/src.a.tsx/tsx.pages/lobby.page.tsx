import { useFetchingUsers } from "../tsx.extensions/getApi/use.get.users.api";
import { useFetchingLoggedInUser } from "../tsx.extensions/getApi/use.get.logged.in.user.api";
import { useNavigate } from 'react-router-dom';
import { Menu } from '../tsx.items/items.menu/menu';

const ChoosingUserPageContent = () => {
    const navigate = useNavigate();
    const { data: users } = useFetchingUsers();
    const { data: loggedInUser } = useFetchingLoggedInUser()
    console.log(loggedInUser)

    return (
        <>
            <div className="lobby-prev-page">
                <div className="lobby-prev-page__title">Chats</div>
                <ul className="lobby-prev-page__users-list">
                    {users?.map(user => (
                        <li key={user.userId} className="lobby-prev-page__users-list--item" onClick={() => navigate("/lobby", { state: { peerWsId: user.userId } })}>
                            <div className="lobby-prev-page__users-list--item__photo"></div>
                            <div className="lobby-prev-page__users-list--item__name">{user.userName}</div>
                            <div className="lobby-prev-page__users-list--item__status">{user.userStatus}</div>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="spec">
            <Menu/>
        </div >
        </>
    );
};

export default ChoosingUserPageContent;