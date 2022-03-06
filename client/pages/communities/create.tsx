import { NextPage } from "next";
import Head from "next/head";
import { Sidebar, Nav, Form } from "../../components";
import { useRouter } from "next/router";
import { getSidebarPropsWithOption } from "../../util/homeSidebarProps.util";
import { useState, useEffect } from "react";
import { UserType } from "../../util/userType.util";
import styles from '../../styles/communities.module.css';
import { queryInterests } from "../../util/interests.util";

const useForceUpdate = () => {
  const [ _, setValue ] = useState(0);
  return () => setValue(value => value + 1);
}

const Create: NextPage = () => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [account, setAccount] = useState<UserType|null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [relatedInterests, setRelatedInterests] = useState<Array<string>>([]);
  const [interests, setInterests] = useState<Array<string>>([]);
  const forceUpdate = useForceUpdate();
  const router = useRouter();

  const auth = async () => {
    const accessToken = localStorage.getItem("at") || "";
    const refreshToken = localStorage.getItem("rt") || "";

    const res = await fetchAccount(accessToken, refreshToken);
    if (res.loggedIn) {
      setLoggedIn(true)
      setAccount(res.account);
      return;
    } else {
      router.push(res.redirect);
      return;
    }
  }

  useEffect(() => {
    auth();
  }, []);

  return (
    <>
      <Head>
        <title>ScrapBook - Home</title>
        <link rel="icon" href="/favicon.ico?v=2" type="image/x-icon" />
      </Head>

      <Sidebar categories={getSidebarPropsWithOption("Communities")} onToggle={(value) => setSidebarCollapsed(value)} />
      <Nav loggedIn={loggedIn} account={loggedIn ? account : null} /> 

      <div className={styles.createContainer} data-collapsed={sidebarCollapsed}>
        <Form 
          heading="Create a community! 📝"
          fields={[
            {
              label: "Community Name",
              placeholder: "e.g. The Amazing Musicians",
              max: 35,
              required: true
            },
            {
              label: "Community Details",
              placeholder: "i.e. What's the community about?",
              max: 512,
              required: false
            },
            {
              label: "Community Interests",
              placeholder: "i.e. What's the community interested in?",
              required: true,
              max: 255,
              onChange: (event) => { 
                const target: HTMLInputElement = event.target as any;
                const empty = !target.value || target.value == "";
                empty ? setRelatedInterests([]) : setRelatedInterests(queryInterests(target.value.toLowerCase()));
              }
            }
          ]}
          tags={[
            ...relatedInterests.map((interest, i) => (
              { 
                value: interest, 
                active: false, 
                onClick: () => {
                  setRelatedInterests([]);
                  if (!interests.includes(interest)) {
                    setInterests(prevState => [...prevState, interest]); 
                  }
                  forceUpdate();
                }
              }
            )),
            ...interests.map((interest) => (
              {
                value: interest,
                active: true,
                onRemove: () => {
                  const newInterests = interests.filter(i => i != interest);
                  setInterests(newInterests);
                  forceUpdate();
                }
              }
            ))
          ]}
          links={[
          {
            text: "Learn more about communities 🧐",
            href: "/info/communities"
          },
          {
            text: "Learn how to create communities 😮",
            href: "/info/create-a-community"
          }
        ]} 
        submitHandler={() => {}}
        />
      </div>
    </>
  );
}

export default Create;