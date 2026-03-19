// import logo from './logo.svg';
import './App.css';
import CustomLogin from './components/CustomLogin';
import { Route , Routes} from 'react-router-dom';
import PrivateRoutes from './routes/PrivateRoutes'

import AdminHome from './admin/AdminHome';
import AssistantHome from './assistant/AssistantHome';
import DoctorHome from './doctor/DoctorHome';
import AdminLayout from './layouts/AdminLayout';
import ManageAdmins from './admin/ManageAdmins';
import ManageDoctors from './admin/ManageDoctors';
import ManageAssistants from './admin/ManageAssistants';
import Appointments from './admin/ManageAppointments';
import Patients from './admin/ManagePatients';
import Treatments from './admin/ManageTreatments';
import Billing from './admin/Billing';
import Reports from './admin/Reports';
import Settings from './admin/Settings';

function App() {
  return (
    <>
    <Routes>
      <Route path='/' element={<CustomLogin />}></Route>

      <Route path='/admin' element={<PrivateRoutes role={"Admin"}><AdminLayout /></PrivateRoutes>}>
          <Route index                element={<AdminHome />} />
          <Route path='admins'        element={<ManageAdmins />} />
          <Route path="doctors"       element={<ManageDoctors />} />
          <Route path="assistants"    element={<ManageAssistants />} />
          <Route path="appointments"  element={<Appointments />} />
          <Route path="patients"      element={<Patients />} />
          <Route path="treatments"    element={<Treatments />} />
          <Route path="billing"       element={<Billing />} />
          <Route path="reports"       element={<Reports />} />
          <Route path="settings"      element={<Settings />} />
      </Route>

      <Route path='/assistant' element={<PrivateRoutes role={"Assistant"}><AssistantHome /></PrivateRoutes>}></Route>
      <Route path='/doctor' element={<PrivateRoutes role={"Doctor"}><DoctorHome /></PrivateRoutes>}></Route>
    </Routes>
    {/* <Login></Login> */}
    </>
  );
}

export default App;
