<?php

namespace App\Http\Controllers;

use App\Models\Attendee;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AttendeeController extends Controller
{
    public function index()
    {
        $attendees = Attendee::all();
        return response()->json(['attendee' => $attendees,], 200);
    }

    public function indexByAppointment($appointment_id)
    {
        $attendees = Attendee::where('appointment_id', $appointment_id)->get();
        $users = [];
        foreach ($attendees as $attendee) {
            $userId = $attendee->user_id;
            $users[] = User::where('id', $userId)->first();
        }

        return response()->json(['attendee' => $users,], 200);
    }

    public function store(Request $request)
    {
        $input = $request->all();
        $validator = Validator::make($input, [
            'appointment_id' => 'required',
        ]);
        if ($validator->fails()) {
            return response()->json([
                'error' => $validator->errors(),
                'message' => 'Validation Error'
            ], 400);
        }
        $user = auth()->user();
        $temp = new Attendee();
        $temp->appointment_id = $input['appointment_id'];
        $temp->user_id = $user->id;
        $temp->is_holder = 0;
        $temp->save();
        return response()->json([
            'status' => 200,
            'message' => 'Attendee created successfully',
            'data' => $temp
        ], 200);
    }

    public function storeMultiple(Request $request)
    {
        $temp = '';
        $inputs = $request->all();
        $validator = Validator::make($inputs, [
            'appointment_id' => 'required',
            'user_ids' => 'required',
        ]);
        if ($validator->fails()) {
            return response()->json([
                'status' => 400,
                'message' => $validator->errors(),
            ]);
        }
        $appointment_id = $request->appointment_id;
        $userIds = $request->user_ids;
        foreach ($userIds as $userId) {
            $temp = new Attendee();
            $temp->appointment_id = $appointment_id;
            $temp->user_id = $userId;
            $temp->is_holder = 0;
            $temp->save();
        }
        return response()->json([
            'status' => 200,
            'message' => 'Attendees created successfully',
        ]);
    }

    public function updateMultiple(Request $request)
    {
        $appointment_id = $request->appointment_id;

        //soft delete
        $attendeeTemp = Attendee::where('appointment_id', $appointment_id)->get();
        foreach ($attendeeTemp as $attendee) {
            $attendee->delete();
        }

        //update
        $temp = '';
        $inputs = $request->all();
        $validator = Validator::make($inputs, [
            'appointment_id' => 'required',
            'user_ids' => 'required',
        ]);
        if ($validator->fails()) {
            return response()->json([
                'status' => 400,
                'message' => $validator->errors(),
            ]);
        }
        $userIds = $request->user_ids;
        foreach ($userIds as $userId) {
            $temp = new Attendee();
            $temp->appointment_id = $appointment_id;
            $temp->user_id = $userId;
            $temp->is_holder = 0;
            $temp->save();
        }
        return response()->json([
            'status' => 200,
            'message' => 'Attendees updated successfully',
        ]);
    }
}
