import { useFetchingUsers } from "../../tsx.extensions/getApi/use.get.users.api";

export const ContactsList = () => {
    const { data: users } = useFetchingUsers();

    return (
        <div className="menu-content__item" >
            <div className="menu-content__item--title">Contacts</div>
            <ul className="menu-content__item--list">
                {users?.map(user => (
                    <li key={user.userId} className="menu-content__item--list-item__users">{user.userName}</li>
                ))}
            </ul>
        </div>
    )
};