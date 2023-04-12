<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use Carbon\Carbon;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

class AppointmentController extends Controller
{
    public function index()
    {
        $appointments = DB::table('appointments')->get();
        return response()->json([
            'appointments' => $appointments
        ]);
    }

    public function indexByUser()
    {
        $user = auth()->user();
        $appointments = Appointment::where('user_id', $user->id)
            ->union(
                Appointment::join('attendees', 'attendees.appointment_id', '=', 'appointments.id')
                    ->where('attendees.user_id', $user->id)
                    ->select('appointments.*')
            )
            ->get();
        return response()->json([
            'appointments' => $appointments
        ]);
    }

    public function checkOverlapping(Appointment $appointment)
    {
        $appointments = DB::table('appointments')->where('user_id', $appointment->user_id)->get();
        foreach ($appointments as $item) {
            if ($appointment->start_time >= $item->start_time && $appointment->start_time <= $item->end_time) {
                return $item;
            }
            if ($appointment->end_time >= $item->start_time && $appointment->end_time <= $item->end_time) {
                return $item;
            }
        }
        return false;
    }

    public function checkDuplicate(Appointment $appointment)
    {
        $appointments = DB::table('appointments')->where('user_id', $appointment->user_id)->get();
        foreach ($appointments as $item) {
            if ($appointment->start_time == $item->start_time && $appointment->end_time == $item->end_time && $appointment->name == $item->name) {
                return $item;
            }
        }
        return false;
    }

    public function store(Request $request)
    {
        $input = $request->all();
        $validator = Validator::make($input, [
            'name' => 'required',
            'location' => 'required',
            'start_time' => 'required',
            'end_time' => 'required',
            'is_reminded' => 'required',
            'is_group_meeting' => 'required',
        ]);
        $user = auth()->user();
        if ($validator->fails()) {
            return response()->json([
                'error' => $validator->errors(),
                'message' => 'Validation Error'
            ], 400);
        }
        $appointment = new Appointment();
        $appointment->name = $input['name'];
        $appointment->user_id = $user->id;
        $appointment->location = $input['location'];
        $appointment->start_time = Carbon::parse($input['start_time'])->setTimezone('Asia/Ho_Chi_Minh')->format('Y-m-d H:i:00');
        $appointment->end_time = Carbon::parse($input['end_time'])->setTimezone('Asia/Ho_Chi_Minh')->format('Y-m-d H:i:00');
        $appointment->is_reminded = $input['is_reminded'];
        $appointment->is_group_meeting = $input['is_group_meeting'];

        if ($item = $this->checkDuplicate($appointment)) {
            return response()->json([
                'message' => 'Duplicate appointment',
                'appointment_id' => $item->id
            ], 400);
        }
        if ($item = $this->checkOverlapping($appointment)) {
            return response()->json([
                'message' => 'Overlapping appointment',
                'appointment_id' => $item->id
            ], 400);
        } else {
            $appointment->save();
        }

        return response()->json([
            'message' => 'Appointment created successfully',
            'appointment' => $appointment
        ], 201);
    }

    public function update(Request $request, $appointment_id)
    {
        $input = $request->all();
        $validator = Validator::make($input, [
            'name' => 'required',
            'location' => 'required',
            'start_time' => 'required',
            'end_time' => 'required',
            'is_reminded' => 'required',
            'is_group_meeting' => 'required',
        ]);
        $user = auth()->user();
        if ($validator->fails()) {
            return response()->json([
                'error' => $validator->errors(),
                'message' => 'Validation Error'
            ], 400);
        }
        $appointment = Appointment::where('id', $appointment_id)->first();
        if (!$appointment) {
            return response()->json([
                'message' => 'Appointment not found',
                'id' => $appointment_id
            ], 404);
        }
        $appointment->name = $input['name'];
        $appointment->user_id = $user->id;
        $appointment->location = $input['location'];
        $appointment->start_time = Carbon::parse($input['start_time'])->setTimezone('Asia/Ho_Chi_Minh')->format('Y-m-d H:i:00');
        $appointment->end_time = Carbon::parse($input['end_time'])->setTimezone('Asia/Ho_Chi_Minh')->format('Y-m-d H:i:00');
        $appointment->is_reminded = $input['is_reminded'];
        $appointment->is_group_meeting = $input['is_group_meeting'];
        $appointment->save();

        return response()->json([
            'message' => 'Appointment updated successfully',
            'appointment' => $appointment
        ], 200);
    }
}
