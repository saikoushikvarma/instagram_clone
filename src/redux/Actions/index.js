import firebase from "firebase";

const users = (data) =>{
    return{
        type:'GET_CURRENT_USER',
        payload:data
    }
};

const userPost = (data) =>{
    return { 
        type: 'USER_POSTS_STATE_CHANGE', 
        payload:data
    }
}

export const FetchUser = () =>{
    return(dispatch=>{
        firebase.firestore().collection("users")
        .doc(firebase.auth().currentUser.uid)
        .get()
        .then(snapshot=>{
            if(snapshot.exists){
                //console.log(snapshot.data())
                dispatch(users(snapshot.data()))
            }else{
                console.log('does not exist')
            }
        })
        .catch(err=>console.log(err))
    })
}

export const FetchUserPost = () =>{
    return ((dispatch) => {
        firebase.firestore()
            .collection("posts")
            .doc(firebase.auth().currentUser.uid)
            .collection("userPosts")
            .orderBy("creation", "asc")
            .get()
            .then((snapshot) => {
                let posts = snapshot.docs.map(doc => {
                    const data = doc.data();
                    const id = doc.id;
                    return { id, ...data }
                })
                dispatch(userPost(posts))
            })
    })
}

export function fetchUserFollowing() {
    return ((dispatch) => {
        firebase.firestore()
            .collection("following")
            .doc(firebase.auth().currentUser.uid)
            .collection("userFollowing")
            .onSnapshot((snapshot) => {
                let following = snapshot.docs.map(doc => {
                    const id = doc.id;
                    return id
                })
                dispatch({ type: 'USER_FOLLOWING_STATE_CHANGE', following });
                for(let i = 0; i < following.length; i++){
                    dispatch(fetchUsersData(following[i], true));
                }
            })
    })
}

export function fetchUsersData(uid, getPosts) {
    return ((dispatch, getState) => {
        const found = getState().users.users.some(el => el.uid === uid);
        if (!found) {
            firebase.firestore()
                .collection("users")
                .doc(uid)
                .get()
                .then((snapshot) => {
                    if (snapshot.exists) {
                        let user = snapshot.data();
                        user.uid = snapshot.id;

                        dispatch({ type: 'USERS_DATA_STATE_CHANGE', user });
                    }
                    else {
                        console.log('does not exist')
                    }
                })
                if(getPosts){
                    dispatch(fetchUsersFollowingPosts(user.uid));
                }
        }
    })
}

export function fetchUsersFollowingPosts(uid) {
    return ((dispatch, getState) => {
        firebase.firestore()
            .collection("posts")
            .doc(uid)
            .collection("userPosts")
            .orderBy("creation", "asc")
            .get()
            .then((snapshot) => {
                const uid = snapshot.docs[0].ref.path.split('/')[1];
                const user = getState().usersState.users.find(el => el.uid === uid);


                let posts = snapshot.docs.map(doc => {
                    const data = doc.data();
                    const id = doc.id;
                    return { id, ...data, user }
                })

                // for(let i = 0; i< posts.length; i++){
                //     dispatch(fetchUsersFollowingLikes(uid, posts[i].id))
                // }
                console.log(posts)
                dispatch({ type: 'USERS_POSTS_STATE_CHANGE', posts, uid })

            })
    })
}
