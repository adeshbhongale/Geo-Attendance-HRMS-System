import { Calendar, Plus } from 'lucide-react-native';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

const LeaveScreen = () => {
  const history = [
    { id: 1, type: 'Sick Leave', status: 'Approved', days: '2 Days', date: 'May 02 - May 04' },
    { id: 2, type: 'Casual Leave', status: 'Pending', days: '1 Day', date: 'May 10 - May 10' },
  ];

  return (
    <View className="flex-1 bg-slate-50">
      <View className="pt-20 px-6 pb-6 bg-white flex-row justify-between items-center rounded-b-[32px] shadow-sm shadow-slate-200">
        <View>
          <Text className="text-2xl font-bold text-slate-900 tracking-tight">Leave Manager</Text>
          <Text className="text-slate-400 font-bold text-[10px]  tracking-widest mt-0.5">Track your time off</Text>
        </View>
        <TouchableOpacity className="w-12 h-12 rounded-2xl bg-indigo-600 justify-center items-center shadow-lg shadow-indigo-200 active:scale-95 transition-transform">
          <Plus size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <View className="flex-row gap-4 mb-10">
          <View className="flex-1 bg-white p-5 rounded-3xl items-center border border-slate-100 shadow-sm shadow-slate-100">
            <Text className="text-2xl font-bold text-indigo-600">12</Text>
            <Text className="text-[10px] font-bold text-slate-400  tracking-widest mt-1">Sick</Text>
          </View>
          <View className="flex-1 bg-white p-5 rounded-3xl items-center border border-slate-100 shadow-sm shadow-slate-100">
            <Text className="text-2xl font-bold text-emerald-600">08</Text>
            <Text className="text-[10px] font-bold text-slate-400  tracking-widest mt-1">Casual</Text>
          </View>
          <View className="flex-1 bg-white p-5 rounded-3xl items-center border border-slate-100 shadow-sm shadow-slate-100">
            <Text className="text-2xl font-bold text-amber-600">15</Text>
            <Text className="text-[10px] font-bold text-slate-400  tracking-widest mt-1">Paid</Text>
          </View>
        </View>

        <View className="flex-row items-center mb-6 px-1">
          <Calendar size={18} color="#64748b" />
          <Text className="text-xs font-bold text-slate-400  tracking-[2px] ml-3">Request History</Text>
        </View>

        {history.map(item => (
          <View key={item.id} className="bg-white p-6 rounded-3xl flex-row justify-between items-center mb-4 border border-slate-100 shadow-sm shadow-slate-100">
            <View className="flex-1">
              <Text className="text-lg font-extrabold text-slate-800 tracking-tight">{item.type}</Text>
              <Text className="text-xs font-medium text-slate-400 mt-1">{item.date} • <Text className="text-slate-600 font-bold">{item.days}</Text></Text>
            </View>
            <View className={`px-4 py-2 rounded-xl ${item.status === 'Approved' ? 'bg-emerald-50' : 'bg-amber-50'}`}>
              <Text className={`text-[10px] font-bold  tracking-widest ${item.status === 'Approved' ? 'text-emerald-600' : 'text-amber-600'}`}>
                {item.status}
              </Text>
            </View>
          </View>
        ))}

        <TouchableOpacity className="mt-6 py-6 items-center">
          <Text className="text-indigo-600 font-bold  text-[11px] tracking-[3px]">View Full History</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default LeaveScreen;
