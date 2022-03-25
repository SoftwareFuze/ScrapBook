import { NextPage } from "next"
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import { Sidebar, Nav, Alert, Popup, PopupType } from "../../components";
import styles from '../../styles/communities.module.css';
import { CommunityType } from "../../util/communityType.util";
import { UserType } from "../../util/userType.util";
import { getSidebarPropsWithOption } from "../../util/homeSidebarProps.util";
const ReactQuill = typeof window === 'object' && require('react-quill');
require('react-quill/dist/quill.snow.css');

const Community: NextPage = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [account, setAccount] = useState<UserType|null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [community, setCommunity] = useState<CommunityType|null>();
  const [communityLoading, setCommunityLoading] = useState(true);
  const [invalidCommunity, setInvalidCommunity] = useState(false);
  const [alerts, setAlerts] = useState<Array<{ message: string, buttons: Array<{ message: string, onClick?: () => any, color?: string }> }>>([]);
  const [errorPopups, setErrorPopups] = useState<Array<string>>([]);
  const [successPopups, setSuccessPopups] = useState<Array<string>>([]);
  const [postBoxOpen, setPostBoxOpen] = useState(false);
  const postBarContainerRef = useRef<HTMLDivElement|null>(null);
  const [editorText, setEditorText] = useState("");
  const [newPostLoading, setNewPostLoading] = useState(false);
  const router = useRouter(); 

  const auth = async () => {
    const accessToken = localStorage.getItem("at") || "";
    const refreshToken = localStorage.getItem("rt") || "";

    const res = await fetchAccount(localStorage, accessToken, refreshToken);
    if (res.loggedIn) {
      setLoggedIn(true)
      setAccount(res.account);
      return;
    } else {
      router.push(res.redirect);
      return;
    }
  }

  const fetchCommunity = async () => {
    const path = new URL(window.location.href).pathname;
    const title = decodeURIComponent(path.split('/')[2]);

    const req = await fetch(backendPath + "/communities/community", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title })
    });
    const res = await req.json();
    setCommunityLoading(false);
    setInvalidCommunity(!res.success);
    if (res.success) {
      setCommunity(res.community);
      return;
    }
  }


  const joinCommunity = async (communityID: string) => {
    const accessToken = localStorage.getItem("at") || "";
    const refreshToken = localStorage.getItem("rt") || "";

    const req = await fetch(backendPath + "/communities/join", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        communityID,
        accessToken, refreshToken
      })
    });
    const res = await req.json();
    
    if (res.success) {
      if (res?.generateNewTokens) {
        localStorage.setItem("at", res?.newAccessToken || "");
        localStorage.setItem("rt", res?.newRefreshToken || "");
      } 

      setCommunity(prevState => res?.community || prevState);
      return; 
    } else {
      setErrorPopups(prevState => [...prevState, res?.error || "An error occurred. Please refresh the page and try again 👁👄👁"]);
      return;
    }
  }

  const leaveCommunity = async (communityID: string) => {
    const accessToken = localStorage.getItem("at") || "";
    const refreshToken = localStorage.getItem("rt") || "";

    const req = await fetch(backendPath + "/communities/leave", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        communityID,
        accessToken, refreshToken
      })
    });
    const res = await req.json();
    
    if (res.success) {
      if (res?.generateNewTokens) {
        localStorage.setItem("at", res?.newAccessToken || "");
        localStorage.setItem("rt", res?.newRefreshToken || "");
      } 

      setCommunity(prevState => res?.community || prevState);
      return; 
    } else {
      setErrorPopups(prevState => [...prevState, res?.error || "An error occurred. Please refresh the page and try again 👁👄👁"]);
      return;
    }
  }

  const submitPost = async (content: string, communityID: string) => {
    const accessToken = localStorage.getItem("at") || "";
    const refreshToken = localStorage.getItem("rt") || "";

    setNewPostLoading(true);
    const req = await fetch(backendPath + "/posts", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        accessToken, refreshToken,
        communityID,
        content
      })
    });
    const res = await req.json();
    setNewPostLoading(false);
    setPostBoxOpen(false);
    postBarContainerRef?.current?.classList.remove(styles.postBarOpen);
    if (res.success) {
      if (res.generateNewTokens) {
        localStorage.setItem("at", res?.newAccessToken);
        localStorage.setItem("rt", res?.newRefreshToken);
      }

      setCommunity(res?.community);
      setSuccessPopups(prevState => [...prevState, "Successfully created post"]);
      return;
    } else {
      setErrorPopups(prevState => [...prevState, res?.error || "An error occurred. Please refresh the page and try again"]);
      return;
    }
  }

  const likePost = (postID: string) => {

  }

  useEffect(() => {
    auth();
  }, []);

  useEffect(() => {
    // Fix this later
    if (loggedIn)
      setTimeout(fetchCommunity, 500);
  }, [loggedIn]);

  return (
    <>
      <Head>
        <title>ScrapBook - Community</title>

        <link rel="icon" href="/favicon.ico?v=2" type="image/x-icon" />
      </Head>

      {errorPopups.map((errorPopup, i) =>
        <Popup 
          key={i}
          message={errorPopup || "An error occurred. Please refresh the page"}
          type={PopupType.ERROR}
          />)}
      {successPopups.map((successPopup, i) =>
        <Popup 
          key={i}
          message={successPopup || "An error occurred. Please refresh the page"}
          type={PopupType.SUCCESS}
          />)}

      <Sidebar categories={getSidebarPropsWithOption("Communities")} onToggle={(value) => setSidebarCollapsed(value)} />
      <Nav loggedIn={loggedIn} account={loggedIn ? account : null} /> 
      {alerts.map((alert, i) =>
        <Alert message={alert.message} buttons={alert.buttons} key={i} />)}

      <div className={styles.communityContainer} data-collapsed={sidebarCollapsed}>
        {communityLoading ? <h1 className={styles.info}>Loading...</h1> : null}
        {(!communityLoading && invalidCommunity) ? <h1 className={styles.info}>Hmm... That community doesn't exist 👁👄👁</h1> : null}

        {(!communityLoading && !invalidCommunity && community) &&
          <>
            <div className={styles.banner} data-title={community.title}>
              <div className={styles.bannerCenter}>
                {(account && !!community?.membersUser?.find(u => u?.id === account.id)) && <div className={styles.leaveCommunity} onClick={() => {
                  setAlerts(prevState => 
                    [
                      ...prevState, 
                      { 
                        message: `Are you sure you want to leave ${community?.title || "this community"}?`,
                        buttons: [
                          { 
                            message: "Yes 👋", 
                            color: "var(--blue)",
                            onClick: () => {
                              leaveCommunity(community?.id || ""); 
                            }
                          },
                          { 
                            message: "No ☝️", 
                            color: "var(--orange)" 
                          }
                        ]
                      }
                    ]
                  );
                }}>➡️</div>}
                <h1>{community.title}</h1>
                <p>{community.details}</p>
              </div>
              <div className={styles.bannerStats}>
                {(account && !community?.membersUser?.find(u => u?.id === account.id)) && <button className={styles.joinCommunity} onClick={() => joinCommunity(community?.id || "")}>Join Community</button>}
                {community.members.length} Member{community.members.length != 1 ? "s" : null} • {community.posts.length} Post{community.posts.length != 1 ? "s" : null}  
              </div>  
            </div>
            <div className={styles.postsContainer}>
              {community.posts.length === 0 && <h4 className={styles.info}>There aren't any posts yet...</h4>}
              {community.posts.length > 0 && community.posts.map((post, i) =>
                <div className={styles.post} key={i} data-posted-by={`Posted by ${post.user.name}`}>
                  <div>
                    <div className={styles.postBody} dangerouslySetInnerHTML={{ __html: post?.body || (post?.images?.length > 0 ? `${post.images.length} Image` : 'No content') }}></div>
                    {(post?.images || []).map((image, i) => 
                      <img src={image?.url} alt="Post image" key={i} className={styles.postImage} onClick={() => window.open(image?.url)} />)}
                  </div>
                  <div className={styles.postRight}>
                    <div data-tooltip={`Posted by ${post.user.name}`} onClick={() => router.push(`/user/${post.user.name}`)}>
                      <img className={styles.posterAvatar} src={post.user.avatar} />
                    </div>
                    <div data-tooltip="Like" onClick={() => likePost(post.id)}>❤️</div>
                    <div data-tooltip="Comment">💬</div>
                    <div data-tooltip="Share" onClick={() => {
                      navigator.clipboard.writeText(`${frontendPath}/post/${post.id}`);
                    }}>🔗</div>
                  </div> 
                </div>)}
            </div>
          </>}
          {(loggedIn && community) &&
            <div className={styles.postBarContainer} data-collapsed={sidebarCollapsed} ref={postBarContainerRef}>
              <form className={styles.postBar} onFocus={() => {
                setPostBoxOpen(true);
                const postBarContainer = postBarContainerRef?.current;
                postBarContainer?.classList.add(styles.postBarOpen);
              }} onSubmit={(event) => {
                event.preventDefault();
                submitPost(editorText, community?.id || "");
              }}>
                {postBoxOpen && <button className={styles.postSubmit}>Submit Post</button>}
                {postBoxOpen && <div className={styles.postBoxExit} onClick={() => {
                  setPostBoxOpen(false);
                  const postBarContainer = postBarContainerRef?.current;
                  postBarContainer?.classList.remove(styles.postBarOpen);
                }}>&times;</div>}
                {!postBoxOpen && <textarea className={styles.postInput} placeholder={`Post to ${community?.title || "this community"}`}></textarea>}
                {(postBoxOpen && newPostLoading) && <h1 className={styles.info}>Creating post...</h1>}
                {(postBoxOpen && !newPostLoading) && 
                  <ReactQuill
                    style={{
                      height: "100%"
                    }}
                    theme="snow" 
                    placeholder={`Post to ${community?.title || "this community"}`} 
                    onChange={setEditorText}
                    formats={[
                      'size',
                      'bold', 'italic', 'underline', 'blockquote',
                      'list', 'bullet',
                      'link', 'image', 'video'
                    ]} 
                    modules={{
                      toolbar: [
                        [{ size: [] }],
                        ['bold', 'italic', 'underline', 'blockquote'],
                        [{'list': 'ordered'}, {'list': 'bullet'}],
                        ['link', 'image', 'video']
                      ],
                      clipboard: {
                        matchVisual: true
                      }
                    }} />}
              </form>
            </div>}
      </div>
    </>
  );
}

export default Community;