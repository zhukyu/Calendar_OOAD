import React, { useEffect, useRef, useState } from 'react'
import Draggable from 'react-draggable';
import './AddAppointment.scss'
import { Modal, Button, Form, Input, InputNumber, TimePicker, Alert, message, Descriptions, Checkbox } from 'antd'
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import axios from 'axios';

function ReminderDetail(props) {

    const data = props.data
    const [checked, setChecked] = useState(data.is_reminded)

    const [attendees, setAttendees] = useState([])

    console.log(data.id);

    const [messageApi, contextHolder] = message.useMessage();

    useEffect(() => {
        const fetchData = async () => {
            const result = await axios(
                `http://127.0.0.1:8000/api/auth/attendees/${data.id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Content-Type': 'application/json'
                }
            }).then((res) => {
                setAttendees(res.data.attendee)
            })
        }
        if (data.id) {
            fetchData();
        }
    }, [data.id])

    useEffect(() => {
        setChecked(data.is_reminded)
    }, [data.is_reminded])
    const layout = {
        labelCol: {
            span: 8,
        },
        wrapperCol: {
            span: 16,
        },
    };
    const validateMessages = {
        required: '${label} is required!',
        types: {
            email: '${label} is not a valid email!',
            number: '${label} is not a valid number!',
        },
        number: {
            range: '${label} must be between ${min} and ${max}',
        },
    };



    const [disabled, setDisabled] = useState(false);
    const [bounds, setBounds] = useState({
        left: 0,
        top: 0,
        bottom: 0,
        right: 0,
    });
    const draggleRef = useRef(null);


    const showModal = () => {
        props.props.setOpen(true);
    };
    const handleOk = (e) => {
        // console.log(e);
        props.setOpen(false);
    };
    const handleCancel = (e) => {
        // console.log(e);
        props.setOpen(false);
    };
    const onStart = (_event, uiData) => {
        const { clientWidth, clientHeight } = window.document.documentElement;
        const targetRect = draggleRef.current?.getBoundingClientRect();
        if (!targetRect) {
            return;
        }
        setBounds({
            left: -targetRect.left + uiData.x,
            right: clientWidth - (targetRect.right - uiData.x),
            top: -targetRect.top + uiData.y,
            bottom: clientHeight - (targetRect.bottom - uiData.y),
        });
    };

    const startTime = dayjs(data.start_time)
    const endTime = dayjs(data.end_time)

    const startTimeStr = startTime.format('YYYY-MM-DD HH:mm')
    const endTimeStr = endTime.format('YYYY-MM-DD HH:mm')

    const handleRemind = async (e) => {
        let tmp = 0
        if (checked === 1) {
            setChecked(0)
        }
        else {
            setChecked(1)
            tmp = 1
        }
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('location', data.location);
        formData.append('start_time', data.start_time);
        formData.append('end_time', data.end_time);
        formData.append('is_reminded', tmp);
        formData.append('is_group_meeting', data.is_group_meeting);
        const res = axios.post(`http://127.0.0.1:8000/api/auth/update-appointment/${data.id}`, formData, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                'Content-Type': 'application/json'
            }
        }).then(res => {
            if (res.status === 200) {
                messageApi.open({
                    type: 'success',
                    content: 'Remind status updated successfully!',
                });
            }
        })
    }

    return (
        <div className='reminder-detail'>
            {contextHolder}
            <Modal
                title={
                    <div
                        style={{
                            width: '100%',
                            cursor: 'move',
                        }}
                        onMouseOver={() => {
                            if (disabled) {
                                setDisabled(false);
                            }
                        }}
                        onMouseOut={() => {
                            setDisabled(true);
                        }}
                        // fix eslintjsx-a11y/mouse-events-have-key-events
                        // https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/blob/master/docs/rules/mouse-events-have-key-events.md
                        onFocus={() => { }}
                        onBlur={() => { }}
                    // end
                    >
                        Appointment Details
                    </div>
                }
                open={props.open}
                onOk={handleOk}
                onCancel={handleCancel}
                modalRender={(modal) => (
                    <Draggable
                        disabled={disabled}
                        bounds={bounds}
                        onStart={(event, uiData) => onStart(event, uiData)}
                    >
                        <div ref={draggleRef}>{modal}</div>
                    </Draggable>
                )}
                footer={null}
            >
                <Descriptions column={2}>
                    <Descriptions.Item label="Name">{data.name}</Descriptions.Item>
                    <Descriptions.Item label="Location">{data.location}</Descriptions.Item>
                    <Descriptions.Item label="Start Time">{startTimeStr}</Descriptions.Item>
                    <Descriptions.Item label="End Time">{endTimeStr}</Descriptions.Item>
                    {attendees && attendees.length > 0 ? (
                        <Descriptions.Item label="Users">
                            {
                                attendees.map((attendee, index) => (
                                    <div key={index} style={{ margin: "0 5px" }}>{attendee.name}</div>
                                ))
                            }
                        </Descriptions.Item>
                    ) : (
                        <div></div>
                    )}
                    <Descriptions.Item></Descriptions.Item>
                    <Descriptions.Item><Checkbox onChange={handleRemind} checked={checked}>Reminded</Checkbox></Descriptions.Item>
                </Descriptions>
            </Modal>
        </div >
    )
}

export default ReminderDetail