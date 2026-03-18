// import logo from './logo.svg';
import './App.css';
import CustomLogin from './Components/CustomLogin';
import { Route , Routes} from 'react-router-dom';
import PrivateRoutes from './routes/PrivateRoutes'

import AdminHome from './Admin/AdminHome';
import AssistantHome from './Assistant/AssistantHome';
import DoctorHome from './Doctor/DoctorHome';

function App() {
  return (
    <>
    <Routes>
      <Route path='/' element={<CustomLogin />}></Route>
      <Route path='/AdminHome' element={<PrivateRoutes role={"Admin"}><AdminHome /></PrivateRoutes>}></Route>
      <Route path='/AssistantHome' element={<PrivateRoutes role={"Assistant"}><AssistantHome /></PrivateRoutes>}></Route>
      <Route path='/DoctorHome' element={<PrivateRoutes role={"Doctor"}><DoctorHome /></PrivateRoutes>}></Route>
    </Routes>
    {/* <Login></Login> */}
    </>
  );
}

export default App;
