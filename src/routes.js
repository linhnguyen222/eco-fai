/*!

=========================================================
* Material Dashboard React - v1.7.0
=========================================================

* Product Page: https://www.creative-tim.com/product/material-dashboard-react
* Copyright 2019 Creative Tim (https://www.creative-tim.com)
* Licensed under MIT (https://github.com/creativetimofficial/material-dashboard-react/blob/master/LICENSE.md)

* Coded by Creative Tim

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/
// @material-ui/icons
import Create from "@material-ui/icons/Create";
import WhereToVote from "@material-ui/icons/WhereToVote";
import TrackChanges from "@material-ui/icons/TrackChanges";
// import Person from "@material-ui/icons/Person";

// core components/views for Admin layout
import CreateConferencePage from "views/CreateConferencePage/CreateConferencePage.jsx";
import UpdateConferencePage from "views/UpdateConferencePage/UpdateConferencePage.jsx";
// import UserProfile from "views/UserProfile/UserProfile.jsx";
import TableList from "views/TableList/TableList.jsx";
import RegisterForConferencePage from "views/RegisterForConferencePage/RegisterForConferencePage";
// import Dashboard from "views/Dashboard/Dashboard";

const dashboardRoutes = [
  {
    path: "/create",
    name: "Create",
    icon: Create,
    component: CreateConferencePage,
    layout: "/admin"
  },
  {
    path: "/update/:slug",
    name: "Update",
    icon: TrackChanges,
    component: UpdateConferencePage,
    layout: "/admin"
  },
  {
    path: "/register/:slug",
    name: "Register",
    icon: WhereToVote,
    component: RegisterForConferencePage,
    layout: "/admin"
  },
  // {
  //   path: "/user",
  //   name: "User Profile",
  //   rtlName: "ملف تعريفي للمستخدم",
  //   icon: Person,
  //   component: UserProfile,
  //   layout: "/admin"
  // },
  {
    path: "/destinations/:slug",
    name: "Destinations List",
    rtlName: "قائمة الجدول",
    icon: "content_paste",
    component: TableList,
    layout: "/admin"
  }
  // {
  //   path: "/dashboard",
  //   name: "Dashboard",
  //   rtlName: "إخطارات",
  //   icon: Notifications,
  //   component: Dashboard,
  //   layout: "/admin"
  // }
];

export default dashboardRoutes;
