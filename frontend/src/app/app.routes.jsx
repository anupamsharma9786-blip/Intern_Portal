import {createBrowserRouter} from "react-router"
import InternLogin from "../pages/intern/Login"

const routes = createBrowserRouter([
    {
        path: "/",
        element: <div>Home</div>
    },
    {
        path: "intern/login",
        element: <InternLogin />
    }
])

export default routes