import React, { useEffect, useMemo, useRef, useState } from 'react'
import Draggable from 'react-draggable';
import './AddAppointment.scss'
import { Modal, Button, Form, Input, InputNumber, TimePicker, Alert, message, DatePicker, Checkbox, Select, Spin } from 'antd'
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2'
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import axios from 'axios';
import debounce from 'lodash/debounce';

function AddAppointment(props) {

    const [startTime, setStartTime] = useState(props.date.hour(dayjs().hour()).minute(dayjs().minute()).second(0))
    const [endTime, setEndTime] = useState(props.date.hour(dayjs().hour()).minute(dayjs().minute()).add(30, 'minute'))
    const data = localStorage.getItem('data') ? JSON.parse(localStorage.getItem('data')) : []
    const navigate = useNavigate();
    const [remind, setRemind] = useState(false);
    const [isMeeting, setIsMeeting] = useState(false);

    const [users, setUsers] = useState([]);

    const [attendee, setAttendee] = useState([]);

    const DebounceSelect = ({ fetchOptions, debounceTimeout = 800, ...props }) => {
        const [fetching, setFetching] = useState(false);
        const [options, setOptions] = useState([]);
        const fetchRef = useRef(0);
        const debounceFetcher = useMemo(() => {
            const loadOptions = (value) => {
                fetchRef.current += 1;
                const fetchId = fetchRef.current;
                setOptions([]);
                setFetching(true);
                fetchOptions(value).then((newOptions) => {
                    if (fetchId !== fetchRef.current) {
                        // for fetch callback order
                        return;
                    }
                    setOptions(newOptions);
                    setFetching(false);
                });
            };
            return debounce(loadOptions, debounceTimeout);
        }, [fetchOptions, debounceTimeout]);
        return (
            <Select
                labelInValue
                filterOption={false}
                onSearch={debounceFetcher}
                notFoundContent={fetching ? <Spin size="small" /> : null}
                {...props}
                options={options}
            />
        );
    }

    const fetchUserList = (username) => {
        console.log('fetching user', username);
        return axios(`http://127.0.0.1:8000/api/users/${username}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                'Content-Type': 'application/json'
            }
        }).then((response) => {
            return response.data.user.map((user) => ({
                label: `${user.name}`,
                value: user.id,
            }))
        });
    }

    useEffect(() => {
        setStartTime(props.date.hour(dayjs().hour()).minute(dayjs().minute()))
        setEndTime(props.date.hour(dayjs().hour()).minute(dayjs().minute()).add(30, 'minute'))
    }, [props.date])

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
    const [form] = Form.useForm();

    const validateTimeDifference = (rule, value, callback) => {
        const { getFieldValue } = form;
        const startTime = getFieldValue('startTime');
        const endTime = getFieldValue('endTime');

        const startDate = new Date(startTime);
        const endDate = new Date(endTime);
        const diffInMs = endDate - startDate;
        const diffInMinutes = Math.floor((diffInMs / 1000) / 60);

        if (diffInMinutes < 1) {
            callback('Invalid duration');
        } else {
            callback();
        }
    };
    const [messageApi, contextHolder] = message.useMessage();
    const success = () => {
        messageApi.open({
            type: 'success',
            content: 'This is a success message',
        });
    };
    const [disabled, setDisabled] = useState(false);
    const [bounds, setBounds] = useState({
        left: 0,
        top: 20,
        bottom: 0,
        right: 0,
    });
    const draggleRef = useRef(null);

    const onFinish = async (values) => {

        let attendeeIDs = []
        if (values.addPeople) {
            attendeeIDs = values.addPeople.map((user) => user.value);
        }

        console.log(values);

        const formData = new FormData();
        formData.append('name', values.name);
        formData.append('location', values.location);
        formData.append('start_time', values.startTime);
        formData.append('end_time', values.endTime);
        if (remind) {
            formData.append('is_reminded', 1);
        }
        else {
            formData.append('is_reminded', 0);
        }
        if (attendeeIDs.length === 0) {
            formData.append('is_group_meeting', 0);
        }
        else {
            formData.append('is_group_meeting', 1);
        }

        const res = await axios.post('http://127.0.0.1:8000/api/auth/add-appointment', formData, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                'Content-Type': 'application/json'
            }
        }).then(res => {
            const appointmentId = res.data.appointment.id
            let sendData = {
                appointment_id: appointmentId,
                user_ids: attendeeIDs
            }
            axios.post('http://127.0.0.1:8000/api/auth/add-attendees', sendData, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                    'Content-Type': 'application/json'
                }
            }).then(res => {
                console.log(res.data);
                props.setOpen(false);
                Swal.fire(
                    'Created!',
                    'Your appointment has been created.',
                    'success'
                ).then(() => {
                    navigate(0)
                })
            })
        }).catch(err => {
            if (err.response.data.message === 'Overlapping appointment') {
                Swal.fire({
                    title: 'Time overlapping?',
                    text: "Your already has an appointment at that time! Do you want to replace it?",
                    icon: 'warning',
                    showCancelButton: true,
                    cancelButtonText: 'Choose another time',
                    confirmButtonText: 'Replace'
                }).then((result) => {
                    if (result.isConfirmed) {
                        const overlappingIndex = err.response.data.appointment_id
                        console.log(overlappingIndex);
                        const res = axios.post(`http://127.0.0.1:8000/api/auth/update-appointment/${overlappingIndex}`, formData, {
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                                'Content-Type': 'application/json'
                            }
                        }).then(res => {
                            if (res.status === 200) {
                                const appointmentId = res.data.appointment.id
                                let sendData = {
                                    appointment_id: appointmentId,
                                    user_ids: attendeeIDs
                                }
                                axios.post('http://127.0.0.1:8000/api/auth/update-attendees', sendData, {
                                    headers: {
                                        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                                        'Content-Type': 'application/json'
                                    }
                                }).then(res => {
                                    console.log(res.data);
                                    props.setOpen(false);
                                    Swal.fire(
                                        'Replaced!',
                                        'Your appointment has been replaced.',
                                        'success'
                                    ).then(() => {
                                        navigate(0)
                                    })
                                })
                            }
                        })
                    }
                })
            }
            else if (err.response.data.message === 'Duplicate appointment') {
                Swal.fire({
                    title: 'Appointment exist!',
                    text: "The appointment you entered has been alrealdy exist! Do you want to join the group meeting instead?",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Join'
                }).then((result) => {
                    if (result.isConfirmed) {
                        const overlappingIndex = err.response.data.appointment_id
                        const formData = new FormData();
                        formData.append('appointment_id', overlappingIndex);
                        const res = axios.post(`http://127.0.0.1:8000/api/auth/add-attendee`, formData, {
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                                'Content-Type': 'application/json'
                            }
                        }).then(res => {
                            if (res.status === 200) {
                                console.log(res.data);
                                props.setOpen(false);
                                Swal.fire(
                                    'Joined!',
                                    'You have joined the group meeting.',
                                    'success'
                                ).then(() => {
                                    navigate(0)
                                })
                            }
                        })
                    }
                })
            }
        })


    };

    const showModal = () => {
        props.props.setOpen(true);
    };
    const handleOk = (e) => {
        console.log(e);
        props.setOpen(false);
    };
    const handleCancel = (e) => {
        console.log(e);
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
    dayjs.extend(customParseFormat);
    const { RangePicker } = DatePicker;
    const range = (start, end) => {
        const result = [];
        for (let i = start; i < end; i++) {
            result.push(i);
        }
        return result;
    };
    // eslint-disable-next-line arrow-body-style
    const disabledDate = (current) => {
        // Can not select days before today and today
        return current && current < dayjs().startOf('day');
    };
    const disabledDateTime = () => ({
        // disabledHours: () => range(0, 24).splice(4, 20),
        // disabledMinutes: () => range(30, 60),
        // disabledSeconds: () => [55, 56],
    });
    const handleRemind = () => {
        setRemind(!remind);
    }
    form.setFieldValue('startTime', startTime);
    form.setFieldValue('endTime', endTime);

    return (
        <div className='add-appointment'>

            <Modal
                title={
                    <div
                        style={{
                            width: '100%',
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
                        Add Appointment
                    </div>
                }
                open={props.open}
                onOk={handleOk}
                onCancel={handleCancel}
                // modalRender={(modal) => (
                //     <Draggable
                //         disabled={disabled}
                //         bounds={bounds}
                //         onStart={(event, uiData) => onStart(event, uiData)}
                //     >
                //         <div ref={draggleRef}>{modal}</div>
                //     </Draggable>
                // )}
                footer={null}
            >
                <Form
                    {...layout}
                    form={form}
                    name="nest-messages"
                    onFinish={onFinish}
                    style={{
                        maxWidth: 600,
                    }}
                    validateMessages={validateMessages}
                // initialValues={{ startTime: startTime, endTime: endTime }}
                >
                    <Form.Item
                        name='name'
                        label="Appointment Name"
                        rules={[
                            {
                                required: true,
                            },
                        ]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name='location'
                        label="Location"
                        rules={[
                            {
                                required: true,
                            },
                        ]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label="Start Time"
                        name='startTime'
                        rules={[{ required: true, message: 'Please select a start time' }]}
                    >
                        <DatePicker
                            placeholder='Select start time'
                            format="YYYY-MM-DD HH:mm"
                            disabledDate={disabledDate}
                            disabledTime={disabledDateTime}
                            showTime={{
                                defaultValue: dayjs('00:00', 'HH:mm'),
                            }}
                            onChange={(value) => { setStartTime(value) }}
                        />
                    </Form.Item>
                    <Form.Item
                        label="End Time"
                        name='endTime'
                        rules={[
                            { required: true, message: 'Please select an end time' },
                            { validator: validateTimeDifference }
                        ]}
                    >
                        <DatePicker
                            placeholder='Select end time'
                            format="YYYY-MM-DD HH:mm"
                            disabledDate={disabledDate}
                            disabledTime={disabledDateTime}
                            showTime={{
                                defaultValue: dayjs('00:00', 'HH:mm'),
                            }}
                            onChange={(value) => { setEndTime(value) }}
                        />
                    </Form.Item>
                    <Form.Item
                        label="Add People"
                        name='addPeople'
                    >
                        <DebounceSelect
                            mode="multiple"
                            value={attendee}
                            placeholder="Select users"
                            fetchOptions={fetchUserList}
                            onChange={(newValue) => {
                                setAttendee(newValue);
                            }}
                            style={{
                                width: '100%',
                            }}
                        />
                    </Form.Item>
                    <Form.Item
                        label="Remind me"
                        name='remind'
                    >
                        <Checkbox onChange={handleRemind}></Checkbox>
                    </Form.Item>
                    <Form.Item
                        wrapperCol={{
                            ...layout.wrapperCol,
                            offset: 8,
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button type="primary" htmlType="submit">
                                Submit
                            </Button>
                        </div>
                    </Form.Item>
                </Form>
            </Modal>
        </div >
    )
}

export default AddAppointment