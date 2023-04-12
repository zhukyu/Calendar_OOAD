import React, { useRef, useState } from 'react'
import Draggable from 'react-draggable';
import './AddAppointment.scss'
import { Modal, Button, Form, Input, InputNumber, TimePicker, Alert, message, Descriptions } from 'antd'
import moment from 'moment';
import { useNavigate } from 'react-router-dom';

function ReminderDetail(props) {

    const data = props.data
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

    const startTime = new Date(data.startTime)
    const endTime = new Date(data.endTime)

    const startTimeStr = startTime.toLocaleTimeString([], { hour: 'numeric', minute: 'numeric' })
    const endTimeStr = endTime.toLocaleTimeString([], { hour: 'numeric', minute: 'numeric' })
    return (
        <div className='add-appointment'>
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
                <Descriptions>
                    <Descriptions.Item label="Name">{data.appointmentName}</Descriptions.Item>
                    <Descriptions.Item label="Date">{data.date}</Descriptions.Item>
                    <Descriptions.Item label="Location">{data.location}</Descriptions.Item>
                    <Descriptions.Item label="Start Time">{startTimeStr}</Descriptions.Item>
                    <Descriptions.Item label="End Time">{endTimeStr}</Descriptions.Item>
                    <Descriptions.Item></Descriptions.Item>
                    <Descriptions.Item label="Users">
                        {data.usernames && data.usernames.length > 0 ? (
                            data.usernames.map((username, index) => (
                                <div key={index} style={{margin: "0 5px"}}>{username.replace(/\"/g, "")}</div>
                            ))
                        ) : (
                            <div>No users found.</div>
                        )}
                    </Descriptions.Item>
                </Descriptions>
            </Modal>
        </div >
    )
}

export default ReminderDetail