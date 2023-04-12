import { Badge, Calendar, Modal } from 'antd';
import './Home.scss'
import { useEffect, useRef, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import AddAppointment from '../components/AddAppointment';
import ReminderDetail from '../components/ReminderDetail';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { DateCalendar, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';


const Home = () => {

    const [data, setData] = useState(null)

    const today = new Date();


    const [open, setOpen] = useState(false);

    const [reload, setReload] = useState(false)

    const navigate = useNavigate();

    const checkJWT = async () => {
        const result = await axios(
            'http://127.0.0.1:8000/api/auth/user-profile', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                'Content-Type': 'application/json'
            }
        }).then((res => {
            console.log(res);
            if (res.status === 401) {
                localStorage.removeItem('access_token');
                navigate('/');
            }
        })).catch((err) => {
            console.log(err);
            localStorage.removeItem('access_token');
            navigate('/');
        })

    }

    useEffect(() => {
        checkJWT();
    }, [])

    useEffect(() => {
        const fetchData = async () => {
            const result = await axios(
                'http://127.0.0.1:8000/api/auth/appointments', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log(result.data.appointments);
            setData(result.data.appointments);
        };

        fetchData();
    }, []);


    const showModal = () => {
        setOpen(true);
    };
    const [reminderIsOpen, setReminderIsOpen] = useState(false);
    const [reminderData, setReminderData] = useState({});

    const [selectedDate, setSelectedDate] = useState(dayjs());

    

    const showReminder = (item) => {
        setReminderIsOpen(true);
        setReminderData(item)
    }

    const getListData = (value) => {
        let listData = [];
        if (data) {
            data.map((item) => {
                const startTime = new Date(item.start_time);
                const endTime = new Date(item.end_time);
                const cellTime = new Date(value);
                if (startTime.toDateString() === cellTime.toDateString()) {
                    listData = [...listData, item];
                }
            })
        }
        return listData || [];
    };
    const getMonthData = (value) => {
        if (value.month() === 8) {
            return 1394;
        }
    };

    const handleChange = (value) => {
        const date = dayjs(value);
        console.log(date.format('YYYY-MM-DD'));

        setSelectedDate(date);
    }

    const handlePanelChange = (value) => {
        const date = dayjs(value);

        setSelectedDate(date);
    }

    const monthCellRender = (value) => {
        const num = getMonthData(value);
        return num ? (
            <div className="notes-month">
                <section>{num}</section>
                <span>Backlog number</span>
            </div>
        ) : null;
    };
    const dateCellRender = (value) => {
        const listData = getListData(value);
        return (
            <ul className="events">
                {listData.map((item, index) => (
                    <li key={index}>
                        <Badge status={'success'} text={item.name} />
                    </li>
                ))}
            </ul>
        );
    };
    const cellRender = (current, info) => {
        if (info.type === 'date') return dateCellRender(current);
        if (info.type === 'month') return monthCellRender(current);
        return info.originNode;
    };
    return (
        <div className='home'>
            <div className='control-panel'>
                <h1>Calendar</h1>
                <button className="button2" onClick={showModal}>
                    <PlusOutlined />
                    Add Appointment
                </button>
                <AddAppointment open={open} setOpen={setOpen} date={selectedDate} reload={reload} setReload={setReload} />
                <div className='reminder'>
                    <h3>Reminder</h3>
                    <div className='reminder-list'>
                        {/* {data ? data.map((item, index) => {
                            if (item.usernames.find((item) => item.replace(/\"/g, "") === JSON.parse(localStorage.getItem('username')))) {
                                return (
                                    <div className='reminder-item' key={index} onClick={() => showReminder(item)}>
                                        <div className='reminder-item__name'>{item.appointmentName}</div>
                                        <div className='reminder-item__date'>{item.date}</div>
                                    </div>
                                )
                            };
                        }) : <></>} */}
                    </div>

                    <ReminderDetail open={reminderIsOpen} setOpen={setReminderIsOpen} data={reminderData} />
                </div>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DateCalendar 
                    showDaysOutsideCurrentMonth={true} 
                    value={selectedDate} 
                    onChange={(value) => { setSelectedDate(value) }} 
                    />
                </LocalizationProvider>
            </div>
            <div className='calendar'>
                <Calendar cellRender={cellRender} onChange={handleChange} onPanelChange={handlePanelChange} value={selectedDate}/>
            </div>
        </div>
    )
};
export default Home;